import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

/**
 * Rutas de super-admin para gestión de negocios.
 * Solo accesible para users con role === 'SUPER_ADMIN'.
 */

async function requireSuperAdmin(req: FastifyRequest, reply: FastifyReply) {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return reply.status(403).send({ error: 'forbidden_admin_only' })
  }
}

interface StatusPatchBody {
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION'
}

interface BusinessParams { id: string }

export async function adminBusinessRoutes(app: FastifyInstance) {

  // ── GET /api/admin/businesses ──────────────────────────────────────────────
  app.get('/', {
    onRequest: [app.authenticate, requireSuperAdmin],
    schema: {
      tags:    ['admin'],
      summary: 'Listar todos los negocios con stats',
    },
  }, async (_req, reply) => {
    const businesses = await app.prisma.business.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id:                 true,
        slug:               true,
        name:               true,
        description:        true,
        timezone:           true,
        subscriptionStatus: true,
        status:             true,
        onboardedAt:        true,
        createdAt:          true,
        _count: {
          select: {
            users:    true,
            products: true,
            orders:   true,
          },
        },
      },
    })

    // Última orden + ingresos por negocio (agg en paralelo)
    const businessIds = businesses.map((b) => b.id)

    const [lastOrders, revenues] = await Promise.all([
      app.prisma.order.groupBy({
        by:   ['businessId'],
        where: { businessId: { in: businessIds } },
        _max:  { createdAt: true },
      }),
      app.prisma.order.groupBy({
        by:   ['businessId'],
        where: {
          businessId: { in: businessIds },
          status:     'PICKED_UP',
        },
        _sum: { subtotal: true },
      }),
    ])

    const lastOrderMap = new Map(lastOrders.map((l) => [l.businessId, l._max.createdAt]))
    const revenueMap   = new Map(revenues  .map((r) => [r.businessId, Number(r._sum.subtotal ?? 0)]))

    return reply.send(businesses.map((b) => ({
      id:                 b.id,
      slug:               b.slug,
      name:               b.name,
      description:        b.description,
      timezone:           b.timezone,
      subscriptionStatus: b.subscriptionStatus,
      status:             b.status,
      onboardedAt:        b.onboardedAt?.toISOString() ?? null,
      createdAt:          b.createdAt.toISOString(),
      stats: {
        usersCount:    b._count.users,
        productsCount: b._count.products,
        ordersCount:   b._count.orders,
        lastOrderAt:   lastOrderMap.get(b.id)?.toISOString() ?? null,
        totalRevenue:  revenueMap.get(b.id) ?? 0,
      },
    })))
  })

  // ── GET /api/admin/businesses/:id ──────────────────────────────────────────
  app.get<{ Params: BusinessParams }>('/:id', {
    onRequest: [app.authenticate, requireSuperAdmin],
    schema: { tags: ['admin'], summary: 'Detalle de un negocio' },
  }, async (req, reply) => {
    const business = await app.prisma.business.findUnique({
      where:  { id: req.params.id },
      select: {
        id:          true, slug: true, name: true, description: true,
        timezone:    true, subscriptionStatus: true, status: true,
        onboardedAt: true, createdAt: true,
        users: {
          orderBy: { createdAt: 'asc' },
          select:  { id: true, email: true, role: true, createdAt: true },
        },
        _count: { select: { products: true, orders: true } },
      },
    })

    if (!business) return reply.status(404).send({ error: 'not_found' })

    return reply.send({
      ...business,
      onboardedAt: business.onboardedAt?.toISOString() ?? null,
      createdAt:   business.createdAt.toISOString(),
      users: business.users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
    })
  })

  // ── PATCH /api/admin/businesses/:id/status ─────────────────────────────────
  app.patch<{ Params: BusinessParams; Body: StatusPatchBody }>('/:id/status', {
    onRequest: [app.authenticate, requireSuperAdmin],
    schema: {
      tags:    ['admin'],
      summary: 'Cambiar status de un negocio (ACTIVE / SUSPENDED / PENDING_VERIFICATION)',
      body: {
        type:       'object',
        required:   ['status'],
        properties: {
          status: { type: 'string', enum: ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'] },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    if (req.validationError) return reply.status(422).send({ error: 'validation_error' })

    const target = await app.prisma.business.findUnique({ where: { id: req.params.id } })
    if (!target) return reply.status(404).send({ error: 'not_found' })

    const updated = await app.prisma.business.update({
      where: { id: req.params.id },
      data:  { status: req.body.status },
      select: { id: true, slug: true, name: true, status: true },
    })

    app.log.info(
      { businessId: updated.id, slug: updated.slug, status: updated.status, by: req.user?.sub },
      'admin: business status changed',
    )

    return reply.send(updated)
  })
}
