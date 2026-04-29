import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@colacero/db'
import { buildServer } from '../../server.js'

const prisma = new PrismaClient()
const app    = buildServer()

const TEST_SLUG = 'checkout-integration-test-biz'

let businessId:     string
let productId:      string
let pickupWindowId: string
let customerToken:  string
let customerId:     string

beforeAll(async () => {
  await app.ready()

  // Negocio
  const business = await prisma.business.upsert({
    where:  { slug: TEST_SLUG },
    update: {},
    create: { slug: TEST_SLUG, name: 'Checkout Test Biz' },
  })
  businessId = business.id

  // Producto con stock
  const product = await prisma.product.create({
    data: {
      businessId,
      name:      'Producto checkout',
      unitPrice: 100,
      isActive:  true,
      inventory: { create: { quantityAvailable: 20, quantityReserved: 0 } },
    },
  })
  productId = product.id

  // Ventana de recogida futura
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)

  const window = await prisma.pickupWindow.create({
    data: {
      businessId,
      date:      tomorrow,
      startTime: '10:00',
      endTime:   '12:00',
      capacity:  10,
      isOpen:    true,
    },
  })
  pickupWindowId = window.id

  // Cliente + token JWT (simular verify-otp)
  const customer = await prisma.customer.upsert({
    where:  { whatsappPhone: '+5355599999' },
    update: {},
    create: { whatsappPhone: '+5355599999' },
  })
  customerId = customer.id
  customerToken = app.jwt.sign({ sub: customer.id, phone: customer.whatsappPhone })
})

afterAll(async () => {
  // Limpiar Redis
  const keys = await app.redis.keys('reservation:*')
  if (keys.length > 0) await app.redis.del(...keys)

  await prisma.order.deleteMany({ where: { businessId } })
  await prisma.pickupWindow.deleteMany({ where: { businessId } })
  await prisma.product.deleteMany({ where: { businessId } })
  await prisma.customer.deleteMany({ where: { whatsappPhone: '+5355599999' } })
  await prisma.business.deleteMany({ where: { slug: TEST_SLUG } })
  await prisma.$disconnect()
  await app.close()
})

describe('GET /api/catalog/:slug/pickup-windows', () => {
  it('windows-ok: devuelve ventanas abiertas con spotsLeft', async () => {
    const res = await app.inject({
      method: 'GET',
      url:    `/api/catalog/${TEST_SLUG}/pickup-windows`,
    })

    expect(res.statusCode).toBe(200)
    const windows = res.json<any[]>()
    expect(Array.isArray(windows)).toBe(true)
    expect(windows.length).toBeGreaterThanOrEqual(1)
    expect(windows[0]).toMatchObject({
      id:        pickupWindowId,
      startTime: '10:00',
      endTime:   '12:00',
      capacity:  10,
      spotsLeft: 10,
    })
  })

  it('windows-404: slug inexistente → 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url:    '/api/catalog/no-existe/pickup-windows',
    })
    expect(res.statusCode).toBe(404)
  })
})

describe('POST /api/cart/checkout', () => {
  it('checkout-201: flujo completo reserve → checkout → Order CONFIRMED', async () => {
    // Crear reserva
    const resReserve = await app.inject({
      method:  'POST',
      url:     '/api/cart/reserve',
      payload: { productId, quantity: 2 },
    })
    expect(resReserve.statusCode).toBe(201)
    const { reservationId } = resReserve.json<any>()

    // Checkout
    const resCheckout = await app.inject({
      method:  'POST',
      url:     '/api/cart/checkout',
      headers: { authorization: `Bearer ${customerToken}` },
      payload: {
        pickupWindowId,
        reservationIds: [reservationId],
        customerName:   'Test Customer',
      },
    })

    expect(resCheckout.statusCode).toBe(201)
    const body = resCheckout.json<any>()
    expect(body.orderId).toBeTruthy()
    expect(body.pickupCode).toHaveLength(6)
    expect(body.subtotal).toBeCloseTo(200)
    expect(body.items).toHaveLength(1)

    // Order existe en DB con status CONFIRMED
    const order = await prisma.order.findUnique({ where: { id: body.orderId } })
    expect(order?.status).toBe('CONFIRMED')
    expect(order?.pickupCode).toBe(body.pickupCode)

    // Reserva eliminada de Redis
    const raw = await app.redis.get(`reservation:${reservationId}`)
    expect(raw).toBeNull()

    // Inventario decrementado
    const inv = await prisma.inventory.findUnique({ where: { productId } })
    expect(inv?.quantityAvailable).toBe(18) // 20 - 2
    expect(inv?.quantityReserved).toBe(0)   // 0 - 0 (ya decrementó al reservar)
  })

  it('checkout-401: sin JWT → 401', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/cart/checkout',
      payload: { pickupWindowId, reservationIds: ['fake'] },
    })
    expect(res.statusCode).toBe(401)
  })

  it('checkout-409: reserva expirada → 409 reservation_expired', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/cart/checkout',
      headers: { authorization: `Bearer ${customerToken}` },
      payload: {
        pickupWindowId,
        reservationIds: ['reserva-que-no-existe'],
      },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json<any>().error).toBe('reservation_expired')
  })
})

describe('GET /api/cart/order/:orderId', () => {
  it('order-ok: devuelve Order con items y ventana', async () => {
    // Crear una Order directamente en DB
    const order = await prisma.order.create({
      data: {
        businessId,
        customerId,
        pickupWindowId,
        status:      'CONFIRMED',
        subtotal:    100,
        pickupCode:  'TEST01',
        confirmedAt: new Date(),
        items: {
          create: [{
            productId,
            quantity:          1,
            unitPriceSnapshot: 100,
            subtotal:          100,
          }],
        },
      },
    })

    const res = await app.inject({
      method:  'GET',
      url:     `/api/cart/order/${order.id}`,
      headers: { authorization: `Bearer ${customerToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json<any>()
    expect(body.id).toBe(order.id)
    expect(body.pickupCode).toBe('TEST01')
    expect(body.items).toHaveLength(1)
    expect(body.pickupWindow).toBeTruthy()
  })

  it('order-404: otro customer no puede ver la Order', async () => {
    const order = await prisma.order.create({
      data: {
        businessId,
        customerId,
        pickupWindowId,
        status:   'CONFIRMED',
        subtotal: 50,
        items:    { create: [{ productId, quantity: 1, unitPriceSnapshot: 50, subtotal: 50 }] },
      },
    })

    const otherToken = app.jwt.sign({ sub: 'otro-customer-id', phone: '+0000000000' })

    const res = await app.inject({
      method:  'GET',
      url:     `/api/cart/order/${order.id}`,
      headers: { authorization: `Bearer ${otherToken}` },
    })

    expect(res.statusCode).toBe(404)
  })
})
