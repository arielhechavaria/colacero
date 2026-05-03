import type { FastifyInstance } from 'fastify'

type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'PICKED_UP' | 'CANCELLED' | 'EXPIRED'

// Valid state transitions for the order status machine
const TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY',     'CANCELLED'],
  READY:     ['PICKED_UP', 'CANCELLED'],
}

interface OrderStatusParams { orderId: string }
interface OrderStatusBody   { status: string }
interface OrdersQuery       { date?: string }

export async function ownerOrderRoutes(app: FastifyInstance) {
  // ── GET /api/owner/orders?date=YYYY-MM-DD ─────────────────────────────────
  app.get<{ Querystring: OrdersQuery }>('/', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-orders'],
      summary:  'Pedidos del día agrupados por ventana de recogida',
      security: [{ bearerAuth: [] }],
      querystring: {
        type:       'object',
        properties: { date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } },
      },
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    // Default to today in America/Havana timezone
    const dateParam = req.query.date
    const targetDate = dateParam
      ? new Date(`${dateParam}T00:00:00`)
      : todayInHavana()

    const dayStart = new Date(targetDate)
    dayStart.setHours(0, 0, 0, 0)

    const dayEnd = new Date(targetDate)
    dayEnd.setHours(23, 59, 59, 999)

    // Fetch all pickup windows for that day, with their orders
    const windows = await app.prisma.pickupWindow.findMany({
      where: {
        businessId,
        date: { gte: dayStart, lte: dayEnd },
      },
      include: {
        orders: {
          where: {
            status: { not: 'DRAFT' },
          },
          include: {
            customer: { select: { id: true, displayName: true, phone: true, telegramId: true } },
            items: {
              include: {
                product: { select: { id: true, name: true, unitLabel: true } },
              },
            },
          },
          orderBy: { confirmedAt: 'asc' },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return reply.send({
      date: targetDate.toISOString().slice(0, 10),
      windows: windows.map((w) => ({
        id:          w.id,
        date:        w.date.toISOString().slice(0, 10),
        startTime:   w.startTime,
        endTime:     w.endTime,
        capacity:    w.capacity,
        ordersCount: w.ordersCount,
        orders:      w.orders.map(serializeOrder),
      })),
    })
  })

  // ── PATCH /api/owner/orders/:orderId/status ────────────────────────────────
  app.patch<{ Params: OrderStatusParams; Body: OrderStatusBody }>(
    '/:orderId/status',
    {
      onRequest: [app.authenticate],
      schema: {
        tags:     ['owner-orders'],
        summary:  'Actualizar estado de un pedido',
        security: [{ bearerAuth: [] }],
        params: {
          type:       'object',
          required:   ['orderId'],
          properties: { orderId: { type: 'string' } },
        },
        body: {
          type:       'object',
          required:   ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['PREPARING', 'READY', 'PICKED_UP', 'CANCELLED'],
            },
          },
        },
      },
      attachValidation: true,
    },
    async (req, reply) => {
      const { businessId } = req.user
      if (!businessId) return reply.status(403).send({ error: 'forbidden' })
      if (req.validationError) return reply.status(422).send({ error: 'validation_error' })

      const { orderId } = req.params
      const { status: newStatus } = req.body

      const order = await app.prisma.order.findUnique({
        where:  { id: orderId },
        select: { id: true, businessId: true, status: true },
      })

      if (!order) return reply.status(404).send({ error: 'order_not_found' })
      if (order.businessId !== businessId) return reply.status(403).send({ error: 'forbidden' })

      const allowed = TRANSITIONS[order.status as OrderStatus] ?? []
      if (!allowed.includes(newStatus as OrderStatus)) {  // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
        return reply.status(400).send({ error: 'invalid_transition' })
      }

      // Timestamp fields for specific transitions
      const timestampField = newStatus === 'READY'
        ? { readyAt: new Date() }
        : newStatus === 'PICKED_UP'
          ? { pickedUpAt: new Date() }
          : {}

      const updated = await app.prisma.order.update({
        where: { id: orderId },
        data:  { status: newStatus as OrderStatus, ...timestampField },
        select: { id: true, status: true },
      })

      // A2 — Notificar al cliente cuando su pedido está listo
      if (newStatus === 'READY') {
        const orderData = await app.prisma.order.findUnique({
          where:  { id: orderId },
          select: {
            pickupCode:   true,
            customer:     { select: { telegramId: true } },
            pickupWindow: { select: { endTime: true } },
          },
        })
        if (orderData?.customer.telegramId) {
          void app.notifQueue.add('customer_ready', {
            type:       'customer_ready',
            chatId:     orderData.customer.telegramId,
            pickupCode: orderData.pickupCode ?? '—',
            endTime:    orderData.pickupWindow?.endTime ?? '',
          })
        }
      }

      return reply.send({
        id:     updated.id,
        status: updated.status,
      })
    },
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayInHavana(): Date {
  // Get the current date in America/Havana and return midnight local
  const havana = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Havana',
    year:  'numeric',
    month: '2-digit',
    day:   '2-digit',
  }).format(new Date())
  // havana is "YYYY-MM-DD"
  return new Date(`${havana}T00:00:00`)
}

function serializeOrder(order: {
  id:          string
  pickupCode:  string | null
  status:      OrderStatus
  subtotal:    { toNumber: () => number }
  confirmedAt: Date | null
  customer:    { id: string; displayName: string | null; phone: string | null; telegramId: string | null }
  items: Array<{
    id:                string
    quantity:          number
    unitPriceSnapshot: { toNumber: () => number }
    subtotal:          { toNumber: () => number }
    product:           { id: string; name: string; unitLabel: string }
  }>
}) {
  return {
    id:          order.id,
    pickupCode:  order.pickupCode,
    status:      order.status,
    subtotal:    order.subtotal.toNumber(),
    confirmedAt: order.confirmedAt?.toISOString() ?? null,
    customer: {
      id:           order.customer.id,
      displayName:  order.customer.displayName,
      phone:        order.customer.phone ?? order.customer.telegramId,
    },
    items: order.items.map((item) => ({
      id:                item.id,
      productId:         item.product.id,
      name:              item.product.name,
      unitLabel:         item.product.unitLabel,
      quantity:          item.quantity,
      unitPriceSnapshot: item.unitPriceSnapshot.toNumber(),
      subtotal:          item.subtotal.toNumber(),
    })),
  }
}
