import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createOrder } from '../../services/order.service.js'

// ── helpers ──────────────────────────────────────────────────────────────────

const WINDOW = {
  id:          'win-1',
  businessId:  'biz-1',
  date:        new Date('2099-12-31T00:00:00.000Z'),
  startTime:   '10:00',
  endTime:     '12:00',
  capacity:    10,
  ordersCount: 0,
  isOpen:      true,
}

const PRODUCT = {
  id:        'prod-1',
  name:      'Pollo',
  unitPrice: 350,
}

const RESERVATION_PAYLOAD = JSON.stringify({
  productId:  'prod-1',
  quantity:   2,
  businessId: 'biz-1',
  createdAt:  new Date().toISOString(),
})

function makeRedis(stored: Record<string, string> = {}) {
  const store = new Map(Object.entries(stored))
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    del: vi.fn(async (...keys: string[]) => { keys.forEach((k) => store.delete(k)); return keys.length }),
    _store: store,
  } as any
}

function makePrisma(overrides: {
  window?:  Partial<typeof WINDOW> | null
  product?: Partial<typeof PRODUCT> | null
  orderExists?: boolean
} = {}) {
  const window = overrides.window === null ? null : { ...WINDOW, ...overrides.window }
  const products = overrides.product === null ? [] : [{ ...PRODUCT, unitPrice: PRODUCT.unitPrice, ...overrides.product }]

  return {
    pickupWindow: {
      findUnique: vi.fn().mockResolvedValue(window),
      update:     vi.fn().mockResolvedValue({}),
    },
    product: {
      findMany: vi.fn().mockResolvedValue(products),
    },
    order: {
      findFirst: vi.fn().mockResolvedValue(overrides.orderExists ? { id: 'existing' } : null),
      create:    vi.fn().mockResolvedValue({ id: 'new-order-id' }),
    },
    inventory: {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    customer: {
      update: vi.fn().mockResolvedValue({}),
    },
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => fn({
      order:       { create: vi.fn().mockResolvedValue({ id: 'new-order-id' }) },
      inventory:   { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      pickupWindow:{ update: vi.fn().mockResolvedValue({}) },
      customer:    { update: vi.fn().mockResolvedValue({}) },
    })),
  } as any
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('createOrder', () => {
  let redis: ReturnType<typeof makeRedis>

  beforeEach(() => {
    redis = makeRedis({ 'reservation:res-1': RESERVATION_PAYLOAD })
  })

  it('checkout-ok: crea Order y devuelve pickupCode + items', async () => {
    const prisma = makePrisma()

    const result = await createOrder(prisma, redis, 'cust-1', {
      pickupWindowId: 'win-1',
      reservationIds: ['res-1'],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.orderId).toBe('new-order-id')
    expect(result.pickupCode).toHaveLength(6)
    expect(result.pickupCode).toMatch(/^[A-Z2-9]{6}$/)
    expect(result.items).toHaveLength(1)
    expect(result.items[0]?.quantity).toBe(2)
  })

  it('checkout-deletes-redis: elimina las keys de reserva de Redis', async () => {
    const prisma = makePrisma()

    await createOrder(prisma, redis, 'cust-1', {
      pickupWindowId: 'win-1',
      reservationIds: ['res-1'],
    })

    expect(redis.del).toHaveBeenCalledWith('reservation:res-1')
  })

  it('checkout-customer-name: actualiza displayName si se provee', async () => {
    const prisma = makePrisma()
    let customerUpdated = false
    prisma.$transaction = vi.fn(async (fn: any) => fn({
      order:        { create: vi.fn().mockResolvedValue({ id: 'new-order-id' }) },
      inventory:    { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      pickupWindow: { update: vi.fn().mockResolvedValue({}) },
      customer:     { update: vi.fn(async () => { customerUpdated = true; return {} }) },
    }))

    await createOrder(prisma, redis, 'cust-1', {
      pickupWindowId: 'win-1',
      reservationIds: ['res-1'],
      customerName:   'Juan Pérez',
    })

    expect(customerUpdated).toBe(true)
  })

  it('checkout-reservation-expired: reserva faltante en Redis → ok=false', async () => {
    const redis = makeRedis({}) // vacío — sin reservas
    const prisma = makePrisma()

    const result = await createOrder(prisma, redis, 'cust-1', {
      pickupWindowId: 'win-1',
      reservationIds: ['res-inexistente'],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('reservation_expired')
  })

  it('checkout-window-not-found: ventana inexistente → ok=false', async () => {
    const prisma = makePrisma({ window: null })

    const result = await createOrder(prisma, redis, 'cust-1', {
      pickupWindowId: 'win-inexistente',
      reservationIds: ['res-1'],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('window_not_found')
  })

  it('checkout-window-full: ordersCount >= capacity → ok=false', async () => {
    const prisma = makePrisma({ window: { capacity: 5, ordersCount: 5 } })

    const result = await createOrder(prisma, redis, 'cust-1', {
      pickupWindowId: 'win-1',
      reservationIds: ['res-1'],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('window_full')
  })

  it('checkout-window-closed: isOpen=false → ok=false', async () => {
    const prisma = makePrisma({ window: { isOpen: false } })

    const result = await createOrder(prisma, redis, 'cust-1', {
      pickupWindowId: 'win-1',
      reservationIds: ['res-1'],
    })

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('window_full')
  })

  it('checkout-subtotal: calcula el subtotal correctamente', async () => {
    // 2 unidades × $350 = $700
    const prisma = makePrisma()

    const result = await createOrder(prisma, redis, 'cust-1', {
      pickupWindowId: 'win-1',
      reservationIds: ['res-1'],
    })

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.subtotal).toBeCloseTo(700)
  })
})
