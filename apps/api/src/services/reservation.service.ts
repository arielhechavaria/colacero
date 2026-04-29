import type { PrismaClient } from '@colacero/db'
import type { Redis } from 'ioredis'
import { randomUUID } from 'node:crypto'

export const RESERVATION_TTL = 600 // segundos

export interface ReservationPayload {
  productId:  string
  quantity:   number
  businessId: string
  createdAt:  string
}

export type ReserveResult =
  | { ok: true;  reservationId: string; expiresAt: string }
  | { ok: false; reason: 'product_not_found' | 'insufficient_stock' }

export type ReleaseResult =
  | { ok: true }
  | { ok: false; reason: 'reservation_not_found' }

/**
 * Reserva `quantity` unidades de `productId` en Redis (TTL 600s).
 * Incrementa `quantityReserved` en la tabla Inventory con optimistic lock.
 * Hasta 3 reintentos en caso de conflicto de versión.
 */
export async function reserveStock(
  prisma:    PrismaClient,
  redis:     Redis,
  productId: string,
  quantity:  number,
): Promise<ReserveResult> {
  // 1. Verificar que el producto existe y obtener businessId
  const product = await prisma.product.findUnique({
    where:   { id: productId },
    select:  { id: true, businessId: true },
  })
  if (!product) return { ok: false, reason: 'product_not_found' }

  // 2. Reservar con optimistic lock (hasta 3 intentos)
  for (let attempt = 0; attempt < 3; attempt++) {
    const inv = await prisma.inventory.findUnique({
      where:  { productId },
      select: { quantityAvailable: true, quantityReserved: true, version: true },
    })
    if (!inv) return { ok: false, reason: 'product_not_found' }

    const free = inv.quantityAvailable - inv.quantityReserved
    if (free < quantity) return { ok: false, reason: 'insufficient_stock' }

    const result = await prisma.inventory.updateMany({
      where: { productId, version: inv.version },
      data:  { quantityReserved: { increment: quantity }, version: { increment: 1 } },
    })

    if (result.count === 0) continue // conflicto de versión — reintentar

    // 3. Guardar reserva en Redis
    const reservationId = randomUUID()
    const createdAt     = new Date().toISOString()
    const payload: ReservationPayload = {
      productId,
      quantity,
      businessId: product.businessId,
      createdAt,
    }

    await redis.set(
      `reservation:${reservationId}`,
      JSON.stringify(payload),
      'EX',
      RESERVATION_TTL,
    )

    const expiresAt = new Date(Date.now() + RESERVATION_TTL * 1000).toISOString()
    return { ok: true, reservationId, expiresAt }
  }

  return { ok: false, reason: 'insufficient_stock' }
}

/**
 * Libera una reserva: elimina la key de Redis y decrementa `quantityReserved`.
 */
export async function releaseReservation(
  prisma: PrismaClient,
  redis:  Redis,
  reservationId: string,
): Promise<ReleaseResult> {
  const raw = await redis.get(`reservation:${reservationId}`)
  if (!raw) return { ok: false, reason: 'reservation_not_found' }

  const payload = JSON.parse(raw) as ReservationPayload

  await redis.del(`reservation:${reservationId}`)

  await prisma.inventory.updateMany({
    where: { productId: payload.productId },
    data:  { quantityReserved: { decrement: payload.quantity } },
  })

  return { ok: true }
}
