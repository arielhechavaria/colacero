import type { FastifyInstance } from 'fastify'
import { env } from '@colacero/env'
import { createOrder } from '../../services/order.service.js'

interface CheckoutBody {
  pickupWindowId: string
  reservationIds: string[]
  customerName?:  string
  notes?:         string
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
          notes:          { type: 'string', maxLength: 500 },
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
    const result = await createOrder(app.prisma, app.redis, customerId, {
      pickupWindowId: req.body.pickupWindowId,
      reservationIds: req.body.reservationIds,
      customerName:   req.body.customerName,
      notes:          req.body.notes,
    })

    if (!result.ok) {
      const status = result.reason === 'window_not_found' ? 404 : 409
      return reply.status(status).send({ error: result.reason })
    }

    // A1 — Notificar al negocio sobre el nuevo pedido
    if (env.TELEGRAM_NOTIFY_CHAT_ID) {
      const itemsText = result.items
        .map((i: { name: string; quantity: number; unitLabel: string }) => `  • ${i.name} × ${i.quantity} ${i.unitLabel}`)
        .join('\n')
      void app.notifQueue.add('business_new_order', {
        type:         'business_new_order',
        chatId:       env.TELEGRAM_NOTIFY_CHAT_ID,
        pickupCode:   result.pickupCode ?? '—',
        customerName: req.body.customerName ?? 'Cliente',
        itemsText:    req.body.notes ? `${itemsText}\n📝 ${req.body.notes}` : itemsText,
        windowTime:   `${result.pickupWindow.startTime} – ${result.pickupWindow.endTime}`,
        total:        `$${Number(result.subtotal).toFixed(2)}`,
      })
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
