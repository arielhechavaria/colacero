import type { FastifyInstance } from 'fastify'

type Period = 'today' | 'yesterday' | 'last7' | 'last30' | 'week' | 'month' | 'lastMonth'

const PERIOD_VALUES = ['today', 'yesterday', 'last7', 'last30', 'week', 'month', 'lastMonth'] as const

// Spread when passing to Prisma — avoids readonly vs mutable mismatch
const BILLABLE = ['CONFIRMED', 'PREPARING', 'READY', 'PICKED_UP'] as const
type BillableStatus = typeof BILLABLE[number]

interface StatsQuery { period?: string; start?: string; end?: string }
interface TopQuery   { period?: string; start?: string; end?: string; limit?: string }

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
          period: { type: 'string', enum: [...PERIOD_VALUES] },
          start:  { type: 'string', format: 'date' },
          end:    { type: 'string', format: 'date' },
        },
      },
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const { start, end } = resolveRange(req.query)

    const billableStatuses: BillableStatus[] = [...BILLABLE]

    const [revenueAgg, ordersCount, deliveredCount, cancelledCount] = await Promise.all([
      app.prisma.order.aggregate({
        where: {
          businessId,
          status:      { in: billableStatuses },
          confirmedAt: { gte: start, lt: end },
        },
        _sum: { subtotal: true },
      }),
      app.prisma.order.count({
        where: {
          businessId,
          status:      { in: billableStatuses },
          confirmedAt: { gte: start, lt: end },
        },
      }),
      app.prisma.order.count({
        where: {
          businessId,
          status:      'PICKED_UP',
          confirmedAt: { gte: start, lt: end },
        },
      }),
      app.prisma.order.count({
        where: {
          businessId,
          status:      'CANCELLED',
          confirmedAt: { gte: start, lt: end },
        },
      }),
    ])

    const revenue = revenueAgg._sum?.subtotal?.toNumber() ?? 0
    const totalCount  = ordersCount + cancelledCount
    const avgTicket   = ordersCount > 0 ? revenue / ordersCount : 0
    const fulfillment = totalCount  > 0 ? (deliveredCount / totalCount) * 100 : 0

    return reply.send({
      periodStart:     start.toISOString(),
      periodEnd:       end.toISOString(),
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
          period: { type: 'string', enum: [...PERIOD_VALUES] },
          start:  { type: 'string', format: 'date' },
          end:    { type: 'string', format: 'date' },
          limit:  { type: 'string' },
        },
      },
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const limit  = Math.min(parseInt(req.query.limit ?? '5', 10) || 5, 20)
    const { start, end } = resolveRange(req.query)

    const billableStatuses: BillableStatus[] = [...BILLABLE]

    const grouped = await app.prisma.orderItem.groupBy({
      by:    ['productId'],
      where: {
        order: {
          businessId,
          status:      { in: billableStatuses },
          confirmedAt: { gte: start, lt: end },
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

  // ── GET /api/owner/stats/copurchases ─────────────────────────────────────
  // Pares de productos que se piden juntos con más frecuencia (últimos 28 días).
  app.get('/copurchases', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-stats'],
      summary:  'Combos de productos pedidos juntos con frecuencia',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const since = new Date()
    since.setDate(since.getDate() - 28)

    const billableStatuses: BillableStatus[] = [...BILLABLE]

    const orders = await app.prisma.order.findMany({
      where: {
        businessId,
        status:      { in: billableStatuses },
        confirmedAt: { gte: since },
      },
      select: {
        items: {
          select: {
            productId: true,
            product:   { select: { name: true } },
          },
        },
      },
    })

    // Count co-occurrence of every product pair across orders
    const pairCount = new Map<string, { nameA: string; nameB: string; count: number }>()

    for (const order of orders) {
      const items = order.items
      if (items.length < 2) continue
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const itemA = items[i]!
          const itemB = items[j]!
          const [a, b] = itemA.productId < itemB.productId
            ? [itemA, itemB]
            : [itemB, itemA]
          const key = `${a.productId}:${b.productId}`
          const entry = pairCount.get(key)
          if (entry) {
            entry.count++
          } else {
            pairCount.set(key, { nameA: a.product.name, nameB: b.product.name, count: 1 })
          }
        }
      }
    }

    const top = Array.from(pairCount.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return reply.send(top)
  })

  // ── GET /api/owner/stats/weekly ───────────────────────────────────────────
  // Pedidos e ingresos por día de la semana (últimas 4 semanas).
  app.get('/weekly', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-stats'],
      summary:  'Distribución de pedidos por día de la semana (últimas 4 semanas)',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const since = new Date()
    since.setDate(since.getDate() - 28)

    const billableStatuses: BillableStatus[] = [...BILLABLE]

    const orders = await app.prisma.order.findMany({
      where: {
        businessId,
        status:      { in: billableStatuses },
        confirmedAt: { gte: since },
      },
      select: { confirmedAt: true, subtotal: true },
    })

    const DAY_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const byDay = Array.from({ length: 7 }, (_, i) => ({
      day:     i,
      label:   DAY_LABELS[i]!,
      orders:  0,
      revenue: 0,
    }))

    for (const order of orders) {
      if (!order.confirmedAt) continue
      const dow = order.confirmedAt.getDay()
      byDay[dow]!.orders++
      byDay[dow]!.revenue += order.subtotal.toNumber()
    }

    // Round revenue
    for (const d of byDay) {
      d.revenue = Math.round(d.revenue * 100) / 100
    }

    // Reorder Mon-Sun (index 1-6, then 0)
    return reply.send([...byDay.slice(1), byDay[0]])
  })

  // ── GET /api/owner/stats/stock-alerts ────────────────────────────────────
  // Productos activos con stock igual o por debajo del umbral mínimo.
  app.get('/stock-alerts', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-stats'],
      summary:  'Productos con stock bajo o agotado',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const products = await app.prisma.product.findMany({
      where: { businessId, isActive: true },
      select: {
        id:   true,
        name: true,
        inventory: {
          select: { quantityAvailable: true, lowStockThreshold: true },
        },
      },
    })

    const alerts = products
      .filter(
        (p) =>
          p.inventory != null &&
          p.inventory.quantityAvailable <= p.inventory.lowStockThreshold,
      )
      .map((p) => ({
        productId:         p.id,
        name:              p.name,
        quantityAvailable: p.inventory!.quantityAvailable,
        lowStockThreshold: p.inventory!.lowStockThreshold,
        status:            p.inventory!.quantityAvailable === 0 ? 'out' : 'low',
      }))
      .sort((a, b) => a.quantityAvailable - b.quantityAvailable)

    return reply.send(alerts)
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resuelve el rango temporal a partir de query params.
 * Prioridad: si vienen `start` y `end` válidos → usar esos.
 * Sino → usar preset `period` (default `today`).
 *
 * `end` es exclusivo (Prisma `lt`). `start` y `end` se calculan en TZ Havana.
 */
function resolveRange(query: { period?: string; start?: string; end?: string }): {
  start: Date
  end: Date
} {
  // Custom range: ?start=YYYY-MM-DD&end=YYYY-MM-DD (end inclusivo desde la perspectiva del usuario)
  if (query.start && query.end) {
    const s = parseLocalDate(query.start)
    const e = parseLocalDate(query.end)
    if (s && e) {
      // Sumar 1 día a end para hacerlo exclusivo
      const endExclusive = new Date(e)
      endExclusive.setDate(endExclusive.getDate() + 1)
      return { start: s, end: endExclusive }
    }
  }

  const period = (query.period ?? 'today') as Period
  return getPresetRange(period)
}

function parseLocalDate(s: string): Date | null {
  // YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function todayHavana(): Date {
  const havana = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Havana',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
  return new Date(`${havana}T00:00:00`)
}

function getPresetRange(period: Period): { start: Date; end: Date } {
  const today = todayHavana()
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)

  switch (period) {
    case 'today':
      return { start: today, end: tomorrow }

    case 'yesterday': {
      const y = new Date(today); y.setDate(today.getDate() - 1)
      return { start: y, end: today }
    }

    case 'last7': {
      const s = new Date(today); s.setDate(today.getDate() - 6) // últimos 7 incluyendo hoy
      return { start: s, end: tomorrow }
    }

    case 'last30': {
      const s = new Date(today); s.setDate(today.getDate() - 29)
      return { start: s, end: tomorrow }
    }

    case 'week': {
      const dow = today.getDay()                  // 0=Sun, 1=Mon…
      const diff = dow === 0 ? -6 : 1 - dow      // retroceder a lunes
      const mon = new Date(today); mon.setDate(today.getDate() + diff)
      return { start: mon, end: tomorrow }
    }

    case 'month': {
      const m = new Date(today); m.setDate(1)
      return { start: m, end: tomorrow }
    }

    case 'lastMonth': {
      const start = new Date(today); start.setMonth(today.getMonth() - 1); start.setDate(1)
      const end   = new Date(today); end.setDate(1) // primer día del mes actual = exclusivo
      return { start, end }
    }
  }
}
