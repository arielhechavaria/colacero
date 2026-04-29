import type { FastifyInstance } from 'fastify'
import { createOrder } from '../../services/order.service.js'

interface CheckoutBody {
  pickupWindowId: string
  reservationIds: string[]
  customerName?:  string
}

export async function cartCheckoutRoutes(app: FastifyInstance) {
  /**
   * POST /api/cart/checkout
   * Confirma el pedido del cliente: crea Order CONFIRMED + genera pickup_code.
   * Requiere JWT de cliente (verify-otp).
   */
  app.post<{ Body: CheckoutBody }>('/checkout', {
    onRequest: [app.authenticate],
    schema: {
      tags:    ['cart'],
      summary: 'Confirmar pedido — crea Order y genera pickup_code',
      body: {
        type:     'object',
        required: ['pickupWindowId', 'reservationIds'],
        properties: {
          pickupWindowId: { type: 'string' },
          reservationIds: { type: 'array', items: { type: 'string' }, minItems: 1 },
          customerName:   { type: 'string' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            orderId:    { type: 'string' },
            pickupCode: { type: 'string' },
            subtotal:   { type: 'number' },
            items:      { type: 'array' },
            pickupWindow: { type: 'object' },
          },
        },
        404: { type: 'object', properties: { error: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (req, reply) => {
    const customerId = req.user.sub
    const result = await createOrder(app.prisma, app.redis, customerId, req.body)

    if (!result.ok) {
      const status = result.reason === 'window_not_found' ? 404 : 409
      return reply.status(status).send({ error: result.reason })
    }

    return reply.status(201).send({
      orderId:     result.orderId,
      pickupCode:  result.pickupCode,
      subtotal:    result.subtotal,
      items:       result.items,
      pickupWindow: result.pickupWindow,
    })
  })
}
