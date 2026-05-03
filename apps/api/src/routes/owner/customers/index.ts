import type { FastifyInstance } from 'fastify'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const VIP_MIN_ORDERS = 5
const VIP_MIN_SPENT  = 50

const EXCLUDED_STATUSES = ['DRAFT', 'EXPIRED'] as const

interface ListQuery {
  search?:  string
  segment?: string
  page?:    string
  limit?:   string
}

interface DetailParams { id: string }

export async function ownerCustomerRoutes(app: FastifyInstance) {

  // ── GET /api/owner/customers ──────────────────────────────────────────────
  app.get<{ Querystring: ListQuery }>('/', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-customers'],
      summary:  'Lista de clientes con métricas',
      security: [{ bearerAuth: [] }],
      querystring: {
        type:       'object',
        properties: {
          search:  { type: 'string' },
          segment: { type: 'string', enum: ['all', 'active', 'vip'] },
          page:    { type: 'string' },
          limit:   { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const segment = req.query.segment ?? 'all'
    const search  = req.query.search?.trim() ?? ''
    const page    = Math.max(1, parseInt(req.query.page  ?? '1',  10) || 1)
    const limit   = Math.min(50, parseInt(req.query.limit ?? '20', 10) || 20)

    // Aggregate order stats per customer for this business (excludes DRAFT/EXPIRED)
    const orderStats = await app.prisma.order.groupBy({
      by:    ['customerId'],
      where: {
        businessId,
        status: { notIn: [...EXCLUDED_STATUSES] },
      },
      _count: { id: true },
      _sum:   { subtotal: true },
      _max:   { confirmedAt: true },
    })

    // Segment filter (operates on order stats)
    const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS)

    const filtered = orderStats.filter((s) => {
      if (segment === 'active') {
        return s._max.confirmedAt != null && s._max.confirmedAt >= thirtyDaysAgo
      }
      if (segment === 'vip') {
        const spent = s._sum.subtotal?.toNumber() ?? 0
        return s._count.id >= VIP_MIN_ORDERS || spent >= VIP_MIN_SPENT
      }
      return true
    })

    if (filtered.length === 0) return reply.send({ total: 0, page, limit, items: [] })

    const customerIds = filtered.map((s) => s.customerId)
    const statsMap    = Object.fromEntries(filtered.map((s) => [s.customerId, s]))

    // Fetch customer records (apply optional search)
    const customers = await app.prisma.customer.findMany({
      where: {
        id: { in: customerIds },
        ...(search
          ? {
              OR: [
                { displayName: { contains: search, mode: 'insensitive' } },
                { phone:       { contains: search } },
              ],
            }
          : {}),
      },
      select: {
        id:          true,
        displayName: true,
        telegramId:  true,
        phone:       true,
        createdAt:   true,
      },
    })

    // Merge stats + sort by lastOrderAt desc
    const items = customers
      .map((c) => {
        const s      = statsMap[c.id]
        const spent  = s?._sum.subtotal?.toNumber() ?? 0
        const orders = s?._count.id ?? 0
        const lastAt = s?._max.confirmedAt ?? null
        return {
          id:          c.id,
          displayName: c.displayName,
          telegramId:  c.telegramId,
          phone:       c.phone,
          createdAt:   c.createdAt.toISOString(),
          totalOrders: orders,
          totalSpent:  Math.round(spent * 100) / 100,
          lastOrderAt: lastAt?.toISOString() ?? null,
          isVip:       orders >= VIP_MIN_ORDERS || spent >= VIP_MIN_SPENT,
          isActive:    lastAt != null && lastAt >= thirtyDaysAgo,
        }
      })
      .sort((a, b) => {
        if (!a.lastOrderAt && !b.lastOrderAt) return 0
        if (!a.lastOrderAt) return 1
        if (!b.lastOrderAt) return -1
        return b.lastOrderAt.localeCompare(a.lastOrderAt)
      })

    const total    = items.length
    const paginated = items.slice((page - 1) * limit, page * limit)

    return reply.send({ total, page, limit, items: paginated })
  })

  // ── GET /api/owner/customers/:id ──────────────────────────────────────────
  app.get<{ Params: DetailParams }>('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-customers'],
      summary:  'Detalle de cliente con historial de pedidos',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const { id } = req.params

    const customer = await app.prisma.customer.findUnique({
      where:  { id },
      select: {
        id:          true,
        displayName: true,
        telegramId:  true,
        phone:       true,
        createdAt:   true,
        lastLoginAt: true,
      },
    })

    if (!customer) return reply.status(404).send({ error: 'not_found' })

    const orders = await app.prisma.order.findMany({
      where:   { customerId: id, businessId },
      orderBy: { confirmedAt: 'desc' },
      select:  {
        id:          true,
        status:      true,
        subtotal:    true,
        pickupCode:  true,
        confirmedAt: true,
        pickedUpAt:  true,
        items: {
          select: {
            id:       true,
            quantity: true,
            subtotal: true,
            product:  { select: { name: true, unitLabel: true } },
          },
        },
      },
    })

    const billable  = orders.filter((o) => !EXCLUDED_STATUSES.includes(o.status as 'DRAFT' | 'EXPIRED') && o.status !== 'CANCELLED')
    const totalSpent = billable.reduce((sum, o) => sum + o.subtotal.toNumber(), 0)

    return reply.send({
      customer: {
        id:          customer.id,
        displayName: customer.displayName,
        telegramId:  customer.telegramId,
        phone:       customer.phone,
        createdAt:   customer.createdAt.toISOString(),
        lastLoginAt: customer.lastLoginAt?.toISOString() ?? null,
      },
      stats: {
        totalOrders:    orders.length,
        totalSpent:     Math.round(totalSpent * 100) / 100,
        lastOrderAt:    orders[0]?.confirmedAt?.toISOString() ?? null,
        cancelledCount: orders.filter((o) => o.status === 'CANCELLED').length,
      },
      orders: orders.map((o) => ({
        id:          o.id,
        status:      o.status,
        subtotal:    o.subtotal.toNumber(),
        pickupCode:  o.pickupCode,
        confirmedAt: o.confirmedAt?.toISOString() ?? null,
        pickedUpAt:  o.pickedUpAt?.toISOString()  ?? null,
        items:       o.items.map((i) => ({
          id:        i.id,
          name:      i.product?.name      ?? 'Producto eliminado',
          unitLabel: i.product?.unitLabel ?? 'unidad',
          quantity:  i.quantity,
          subtotal:  i.subtotal.toNumber(),
        })),
      })),
    })
  })
}
