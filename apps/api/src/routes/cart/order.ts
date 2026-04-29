import type { FastifyInstance } from 'fastify'

interface OrderParams {
  orderId: string
}

export async function cartOrderRoutes(app: FastifyInstance) {
  /**
   * GET /api/cart/order/:orderId
   * Devuelve una Order con items y ventana de recogida.
   * Solo el cliente dueño de la Order puede verla.
   */
  app.get<{ Params: OrderParams }>('/order/:orderId', {
    onRequest: [app.authenticate],
    schema: {
      tags:    ['cart'],
      summary: 'Obtener detalles de una Order confirmada',
      params: {
        type:       'object',
        required:   ['orderId'],
        properties: { orderId: { type: 'string' } },
      },
      response: {
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (req, reply) => {
    const customerId = req.user.sub
    const { orderId } = req.params

    const order = await app.prisma.order.findUnique({
      where:  { id: orderId },
      select: {
        id:          true,
        pickupCode:  true,
        status:      true,
        subtotal:    true,
        confirmedAt: true,
        business: {
          select: { id: true, name: true, slug: true },
        },
        customer: {
          select: { id: true },
        },
        pickupWindow: {
          select: { id: true, date: true, startTime: true, endTime: true },
        },
        items: {
          select: {
            id:                true,
            quantity:          true,
            unitPriceSnapshot: true,
            subtotal:          true,
            product: {
              select: { id: true, name: true, unitLabel: true },
            },
          },
        },
      },
    })

    if (!order) return reply.status(404).send({ error: 'order_not_found' })

    // Solo el dueño puede ver su Order
    if (order.customer.id !== customerId) {
      return reply.status(404).send({ error: 'order_not_found' })
    }

    return reply.send({
      id:          order.id,
      pickupCode:  order.pickupCode,
      status:      order.status,
      subtotal:    Number(order.subtotal),
      confirmedAt: order.confirmedAt?.toISOString() ?? null,
      business:    order.business,
      pickupWindow: order.pickupWindow
        ? {
            id:        order.pickupWindow.id,
            date:      order.pickupWindow.date.toISOString(),
            startTime: order.pickupWindow.startTime,
            endTime:   order.pickupWindow.endTime,
          }
        : null,
      items: order.items.map((item) => ({
        id:                item.id,
        productId:         item.product.id,
        name:              item.product.name,
        unitLabel:         item.product.unitLabel,
        quantity:          item.quantity,
        unitPriceSnapshot: Number(item.unitPriceSnapshot),
        subtotal:          Number(item.subtotal),
      })),
    })
  })
}
