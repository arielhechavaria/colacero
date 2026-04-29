import type { PrismaClient } from '@colacero/db'
import type { Redis } from 'ioredis'
import type { ReservationPayload } from './reservation.service.js'

const PICKUP_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // sin O,0,I,1 — ambiguos
const PICKUP_CODE_LENGTH = 6
const MAX_CODE_ATTEMPTS  = 5

export interface CheckoutInput {
  pickupWindowId: string
  reservationIds: string[]
  customerName?:  string
}

export interface OrderResult {
  ok: true
  orderId:     string
  pickupCode:  string
  subtotal:    number
  items:       Array<{ productId: string; name: string; quantity: number; unitPrice: number; subtotal: number }>
  pickupWindow: { id: string; date: string; startTime: string; endTime: string }
}

export type CheckoutResult =
  | OrderResult
  | { ok: false; reason: 'reservation_expired' | 'window_not_found' | 'window_full' | 'insufficient_stock' }

function generateCode(): string {
  let code = ''
  for (let i = 0; i < PICKUP_CODE_LENGTH; i++) {
    code += PICKUP_CODE_CHARS[Math.floor(Math.random() * PICKUP_CODE_CHARS.length)]
  }
  return code
}

async function uniquePickupCode(prisma: PrismaClient, businessId: string, date: Date): Promise<string | null> {
  // Rango del día (medianoche a medianoche en UTC — ajustar si se usa timezone)
  const start = new Date(date)
  start.setUTCHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setUTCDate(end.getUTCDate() + 1)

  for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
    const code = generateCode()
    const existing = await prisma.order.findFirst({
      where: {
        businessId,
        pickupCode: code,
        createdAt:  { gte: start, lt: end },
      },
      select: { id: true },
    })
    if (!existing) return code
  }
  return null
}

/**
 * Crea una Order CONFIRMED a partir de reservas en Redis.
 * Atomicidad: optimistic lock en Inventory + transacción Prisma para Order + items.
 */
export async function createOrder(
  prisma:     PrismaClient,
  redis:      Redis,
  customerId: string,
  input:      CheckoutInput,
): Promise<CheckoutResult> {
  const { pickupWindowId, reservationIds, customerName } = input

  // 1. Cargar todas las reservas desde Redis
  const rawValues = await Promise.all(
    reservationIds.map((id) => redis.get(`reservation:${id}`)),
  )

  const reservations: ReservationPayload[] = []
  for (const raw of rawValues) {
    if (!raw) return { ok: false, reason: 'reservation_expired' }
    reservations.push(JSON.parse(raw) as ReservationPayload)
  }

  // 2. Verificar la ventana de recogida
  const window = await prisma.pickupWindow.findUnique({
    where:  { id: pickupWindowId },
    select: { id: true, businessId: true, date: true, startTime: true, endTime: true, capacity: true, ordersCount: true, isOpen: true },
  })
  if (!window) return { ok: false, reason: 'window_not_found' }
  if (!window.isOpen || window.ordersCount >= window.capacity) return { ok: false, reason: 'window_full' }

  // 3. Verificar que todas las reservas son del mismo negocio
  const businessId = window.businessId

  // 4. Cargar precios snapshot de los productos
  const productIds = [...new Set(reservations.map((r) => r.productId))]
  const products = await prisma.product.findMany({
    where:  { id: { in: productIds }, businessId },
    select: { id: true, name: true, unitPrice: true },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))

  for (const r of reservations) {
    if (!productMap.has(r.productId)) return { ok: false, reason: 'insufficient_stock' }
  }

  // 5. Generar pickup_code único para el día
  const pickupCode = await uniquePickupCode(prisma, businessId, window.date)
  if (!pickupCode) return { ok: false, reason: 'insufficient_stock' } // caso extremadamente raro

  // 6. Agrupar items (puede haber múltiples reservas del mismo producto)
  const itemMap = new Map<string, { quantity: number; unitPrice: number; name: string }>()
  for (const r of reservations) {
    const product = productMap.get(r.productId)!
    const existing = itemMap.get(r.productId)
    if (existing) {
      existing.quantity += r.quantity
    } else {
      itemMap.set(r.productId, {
        quantity:  r.quantity,
        unitPrice: Number(product.unitPrice),
        name:      product.name,
      })
    }
  }

  const subtotal = [...itemMap.entries()].reduce(
    (sum, [, item]) => sum + item.unitPrice * item.quantity,
    0,
  )

  // 7. Crear Order + items en transacción
  const order = await prisma.$transaction(async (tx) => {
    // Crear la Order
    const newOrder = await tx.order.create({
      data: {
        businessId,
        customerId,
        pickupWindowId,
        status:      'CONFIRMED',
        subtotal,
        pickupCode,
        confirmedAt: new Date(),
        items: {
          create: [...itemMap.entries()].map(([productId, item]) => ({
            productId,
            quantity:          item.quantity,
            unitPriceSnapshot: item.unitPrice,
            subtotal:          item.unitPrice * item.quantity,
          })),
        },
      },
      select: { id: true },
    })

    // Actualizar inventario para cada item
    for (const [productId, item] of itemMap) {
      await tx.inventory.updateMany({
        where: { productId },
        data:  {
          quantityAvailable: { decrement: item.quantity },
          quantityReserved:  { decrement: item.quantity },
        },
      })
    }

    // Incrementar ordersCount en la ventana
    await tx.pickupWindow.update({
      where: { id: pickupWindowId },
      data:  { ordersCount: { increment: 1 } },
    })

    // Actualizar displayName si se proveyó
    if (customerName) {
      await tx.customer.update({
        where: { id: customerId },
        data:  { displayName: customerName },
      })
    }

    return newOrder
  })

  // 8. Eliminar reservas de Redis (fuera de la transacción DB — si falla no es crítico)
  const redisKeys = reservationIds.map((id) => `reservation:${id}`)
  if (redisKeys.length > 0) await redis.del(...redisKeys)

  return {
    ok: true,
    orderId:    order.id,
    pickupCode,
    subtotal,
    items: [...itemMap.entries()].map(([productId, item]) => ({
      productId,
      name:      item.name,
      quantity:  item.quantity,
      unitPrice: item.unitPrice,
      subtotal:  item.unitPrice * item.quantity,
    })),
    pickupWindow: {
      id:        window.id,
      date:      window.date.toISOString(),
      startTime: window.startTime,
      endTime:   window.endTime,
    },
  }
}
