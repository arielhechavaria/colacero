import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@colacero/db'
import { buildServer } from '../../server.js'

const prisma = new PrismaClient()
const app    = buildServer()

const TEST_SLUG = 'cart-reservation-test-biz'

let businessId: string
let productId:  string

beforeAll(async () => {
  await app.ready()

  const business = await prisma.business.upsert({
    where:  { slug: TEST_SLUG },
    update: {},
    create: { slug: TEST_SLUG, name: 'Cart Test Biz' },
  })
  businessId = business.id

  const product = await prisma.product.create({
    data: {
      businessId,
      name:      'Producto reservable',
      unitPrice: 100,
      isActive:  true,
      inventory: { create: { quantityAvailable: 10, quantityReserved: 0 } },
    },
  })
  productId = product.id
})

afterAll(async () => {
  // Limpiar reservas en Redis que puedan quedar de tests
  const keys = await app.redis.keys('reservation:*')
  if (keys.length > 0) await app.redis.del(...keys)

  await prisma.product.deleteMany({ where: { businessId } })
  await prisma.business.deleteMany({ where: { slug: TEST_SLUG } })
  await prisma.$disconnect()
  await app.close()
})

describe('POST /api/cart/reserve', () => {
  it('reserve-201: reserva stock y devuelve reservationId + expiresAt', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/cart/reserve',
      payload: { productId, quantity: 2 },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json<any>()
    expect(typeof body.reservationId).toBe('string')
    expect(typeof body.expiresAt).toBe('string')
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now())

    // Verificar que quantityReserved se incrementó
    const inv = await prisma.inventory.findUnique({ where: { productId } })
    expect(inv?.quantityReserved).toBe(2)
  })

  it('reserve-ttl: la key existe en Redis con TTL ~600s', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/cart/reserve',
      payload: { productId, quantity: 1 },
    })
    const { reservationId } = res.json<any>()

    const ttl = await app.redis.ttl(`reservation:${reservationId}`)
    expect(ttl).toBeGreaterThan(590)
    expect(ttl).toBeLessThanOrEqual(600)
  })

  it('reserve-404: producto inexistente → 404 product_not_found', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/cart/reserve',
      payload: { productId: 'prod-no-existe', quantity: 1 },
    })

    expect(res.statusCode).toBe(404)
    expect(res.json<any>().error).toBe('product_not_found')
  })

  it('reserve-409: stock insuficiente → 409 insufficient_stock', async () => {
    // Pedir más del disponible (quedan 10 - lo ya reservado)
    const res = await app.inject({
      method:  'POST',
      url:     '/api/cart/reserve',
      payload: { productId, quantity: 999 },
    })

    expect(res.statusCode).toBe(409)
    expect(res.json<any>().error).toBe('insufficient_stock')
  })
})

describe('DELETE /api/cart/reserve/:reservationId', () => {
  it('release-204: libera la reserva y decrementa quantityReserved', async () => {
    // Crear una reserva primero
    const resReserve = await app.inject({
      method:  'POST',
      url:     '/api/cart/reserve',
      payload: { productId, quantity: 1 },
    })
    const { reservationId } = resReserve.json<any>()

    const invBefore = await prisma.inventory.findUnique({ where: { productId } })
    const reservedBefore = invBefore?.quantityReserved ?? 0

    // Liberar
    const resRelease = await app.inject({
      method: 'DELETE',
      url:    `/api/cart/reserve/${reservationId}`,
    })

    expect(resRelease.statusCode).toBe(204)

    // Verificar que quantityReserved bajó
    const invAfter = await prisma.inventory.findUnique({ where: { productId } })
    expect(invAfter?.quantityReserved).toBe(reservedBefore - 1)

    // Verificar que la key ya no existe en Redis
    const raw = await app.redis.get(`reservation:${reservationId}`)
    expect(raw).toBeNull()
  })

  it('release-404: reservationId inexistente → 404 reservation_not_found', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url:    '/api/cart/reserve/no-existe-uuid',
    })

    expect(res.statusCode).toBe(404)
    expect(res.json<any>().error).toBe('reservation_not_found')
  })
})
