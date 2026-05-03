import type { FastifyInstance } from 'fastify'

type Period = 'today' | 'week' | 'month'

// Spread when passing to Prisma — avoids readonly vs mutable mismatch
const BILLABLE = ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP'] as const
type BillableStatus = typeof BILLABLE[number]

interface StatsQuery { period?: string }
interface TopQuery   { period?: string; limit?: string }

export async function ownerStatsRoutes(app: FastifyInstance) {
  // ── GET /api/owner/stats/summary?period=today|week|month ──────────────────
  app.get<{ Querystring: StatsQuery }>('/summary', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-stats'],
      summary:  'Resumen de métricas por período',
      security: [{ bearerAuth: [] }],
      querystring: {
        type:       'object',
        properties: {
          period: { type: 'string', enum: ['today', 'week', 'month'] },
        },
      },
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const period = (req.query.period ?? 'today') as Period
    const start  = getPeriodStart(period)

    const billableStatuses: BillableStatus[] = [...BILLABLE]

    const [revenueAgg, ordersCount, deliveredCount, cancelledCount] = await Promise.all([
      app.prisma.order.aggregate({
        where: {
          businessId,
          status:      { in: billableStatuses },
          confirmedAt: { gte: start },
        },
        _sum: { subtotal: true },
      }),
      app.prisma.order.count({
        where: {
          businessId,
          status:      { in: billableStatuses },
          confirmedAt: { gte: start },
        },
      }),
      app.prisma.order.count({
        where: {
          businessId,
          status:      'PICKED_UP',
          confirmedAt: { gte: start },
        },
      }),
      app.prisma.order.count({
        where: {
          businessId,
          status:      'CANCELLED',
          confirmedAt: { gte: start },
        },
      }),
    ])

    const revenue = revenueAgg._sum?.subtotal?.toNumber() ?? 0
    const totalCount  = ordersCount + cancelledCount
    const avgTicket   = ordersCount > 0 ? revenue / ordersCount : 0
    const fulfillment = totalCount  > 0 ? (deliveredCount / totalCount) * 100 : 0

    return reply.send({
      period,
      periodStart:     start.toISOString(),
      revenue:         Math.round(revenue * 100) / 100,
      ordersCount,
      deliveredCount,
      cancelledCount,
      avgTicket:       Math.round(avgTicket * 100) / 100,
      fulfillmentRate: Math.round(fulfillment * 10) / 10,
    })
  })

  // ── GET /api/owner/stats/top-products?period=today|week|month&limit=5 ─────
  app.get<{ Querystring: TopQuery }>('/top-products', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-stats'],
      summary:  'Productos más vendidos en el período',
      security: [{ bearerAuth: [] }],
      querystring: {
        type:       'object',
        properties: {
          period: { type: 'string', enum: ['today', 'week', 'month'] },
          limit:  { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const period = (req.query.period ?? 'today') as Period
    const limit  = Math.min(parseInt(req.query.limit ?? '5', 10) || 5, 20)
    const start  = getPeriodStart(period)

    const billableStatuses: BillableStatus[] = [...BILLABLE]

    const grouped = await app.prisma.orderItem.groupBy({
      by:    ['productId'],
      where: {
        order: {
          businessId,
          status:      { in: billableStatuses },
          confirmedAt: { gte: start },
        },
      },
      _sum:     { quantity: true, subtotal: true },
      orderBy:  { _sum: { quantity: 'desc' } },
      take:     limit,
    })

    if (grouped.length === 0) return reply.send([])

    const ids      = grouped.map((g) => g.productId)
    const products = await app.prisma.product.findMany({
      where:  { id: { in: ids } },
      select: { id: true, name: true, unitLabel: true },
    })
    const pMap = Object.fromEntries(products.map((p) => [p.id, p]))

    return reply.send(
      grouped.map((g) => ({
        productId: g.productId,
        name:      pMap[g.productId]?.name     ?? 'Producto eliminado',
        unitLabel: pMap[g.productId]?.unitLabel ?? 'unidad',
        totalQty:  g._sum?.quantity ?? 0,
        totalRev:  Math.round((g._sum?.subtotal?.toNumber() ?? 0) * 100) / 100,
      })),
    )
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPeriodStart(period: Period): Date {
  // Get today's date in Havana timezone
  const havana = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Havana',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())

  const today = new Date(`${havana}T00:00:00`)

  if (period === 'today') return today

  if (period === 'week') {
    const dow = today.getDay()                 // 0=Sun, 1=Mon…
    const diff = dow === 0 ? -6 : 1 - dow     // back to Monday
    const mon = new Date(today)
    mon.setDate(today.getDate() + diff)
    return mon
  }

  // month — 1st of current month
  const m = new Date(today)
  m.setDate(1)
  return m
}
