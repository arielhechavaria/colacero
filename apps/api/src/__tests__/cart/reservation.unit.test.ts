import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reserveStock, releaseReservation, RESERVATION_TTL } from '../../services/reservation.service.js'

// ── helpers ──────────────────────────────────────────────────────────────────

function makePrisma(overrides: Record<string, unknown> = {}) {
  return {
    product: {
      findUnique: vi.fn().mockResolvedValue({
        id:         'prod-1',
        businessId: 'biz-1',
        ...overrides['product'],
      }),
    },
    inventory: {
      findUnique: vi.fn().mockResolvedValue({
        quantityAvailable: 10,
        quantityReserved:  2,
        version:           0,
        ...overrides['inventory'],
      }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  } as any
}

function makeRedis() {
  const store = new Map<string, string>()
  return {
    set: vi.fn(async (key: string, value: string) => { store.set(key, value); return 'OK' }),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    del: vi.fn(async (key: string) => { store.delete(key); return 1 }),
    _store: store,
  } as any
}

// ── reserveStock ─────────────────────────────────────────────────────────────

describe('reserveStock', () => {
  let prisma: ReturnType<typeof makePrisma>
  let redis:  ReturnType<typeof makeRedis>

  beforeEach(() => {
    prisma = makePrisma()
    redis  = makeRedis()
  })

  it('reserve-ok: devuelve reservationId y expiresAt', async () => {
    const result = await reserveStock(prisma, redis, 'prod-1', 3)

    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(typeof result.reservationId).toBe('string')
    expect(result.reservationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    )
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now())
  })

  it('reserve-increments-reserved: llama updateMany con increment', async () => {
    await reserveStock(prisma, redis, 'prod-1', 3)

    expect(prisma.inventory.updateMany).toHaveBeenCalledWith({
      where: { productId: 'prod-1', version: 0 },
      data:  { quantityReserved: { increment: 3 }, version: { increment: 1 } },
    })
  })

  it('reserve-redis-ttl: guarda en Redis con EX 600', async () => {
    await reserveStock(prisma, redis, 'prod-1', 2)

    expect(redis.set).toHaveBeenCalledWith(
      expect.stringMatching(/^reservation:/),
      expect.any(String),
      'EX',
      RESERVATION_TTL,
    )
  })

  it('reserve-product-not-found: → ok=false reason=product_not_found', async () => {
    prisma.product.findUnique.mockResolvedValue(null)

    const result = await reserveStock(prisma, redis, 'no-existe', 1)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('product_not_found')
  })

  it('reserve-no-inventory: inventory null → ok=false reason=product_not_found', async () => {
    prisma.inventory.findUnique.mockResolvedValue(null)

    const result = await reserveStock(prisma, redis, 'prod-1', 1)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('product_not_found')
  })

  it('reserve-insufficient: free < quantity → ok=false reason=insufficient_stock', async () => {
    // available=10, reserved=8 → free=2, pidiendo 5
    prisma.inventory.findUnique.mockResolvedValue({
      quantityAvailable: 10,
      quantityReserved:  8,
      version:           0,
    })

    const result = await reserveStock(prisma, redis, 'prod-1', 5)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('insufficient_stock')
  })

  it('reserve-ol-retry: reintenta si updateMany devuelve count=0', async () => {
    // Primera lectura falla (conflicto), segunda tiene éxito
    prisma.inventory.updateMany
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })

    const result = await reserveStock(prisma, redis, 'prod-1', 1)

    expect(result.ok).toBe(true)
    expect(prisma.inventory.updateMany).toHaveBeenCalledTimes(2)
  })

  it('reserve-ol-exhausted: 3 conflictos → ok=false reason=insufficient_stock', async () => {
    prisma.inventory.updateMany.mockResolvedValue({ count: 0 })

    const result = await reserveStock(prisma, redis, 'prod-1', 1)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('insufficient_stock')
    expect(prisma.inventory.updateMany).toHaveBeenCalledTimes(3)
  })
})

// ── releaseReservation ────────────────────────────────────────────────────────

describe('releaseReservation', () => {
  it('release-ok: elimina key y decrementa quantityReserved', async () => {
    const prisma = makePrisma()
    const redis  = makeRedis()

    // Simular reserva preexistente en Redis
    const payload = JSON.stringify({
      productId:  'prod-1',
      quantity:   2,
      businessId: 'biz-1',
      createdAt:  new Date().toISOString(),
    })
    redis._store.set('reservation:res-abc', payload)

    const result = await releaseReservation(prisma, redis, 'res-abc')

    expect(result.ok).toBe(true)
    expect(redis.del).toHaveBeenCalledWith('reservation:res-abc')
    expect(prisma.inventory.updateMany).toHaveBeenCalledWith({
      where: { productId: 'prod-1' },
      data:  { quantityReserved: { decrement: 2 } },
    })
  })

  it('release-not-found: key inexistente → ok=false reason=reservation_not_found', async () => {
    const prisma = makePrisma()
    const redis  = makeRedis()

    const result = await releaseReservation(prisma, redis, 'no-existe')

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toBe('reservation_not_found')
    expect(prisma.inventory.updateMany).not.toHaveBeenCalled()
  })
})
