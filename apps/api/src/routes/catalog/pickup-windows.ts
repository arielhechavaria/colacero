import type { FastifyInstance } from 'fastify'

interface PickupWindowsParams {
  slug: string
}

export async function pickupWindowsRoute(app: FastifyInstance) {
  /**
   * GET /api/catalog/:slug/pickup-windows
   * Endpoint público — devuelve ventanas de recogida abiertas con capacidad disponible.
   */
  app.get<{ Params: PickupWindowsParams }>('/:slug/pickup-windows', {
    schema: {
      tags:    ['catalog'],
      summary: 'Ventanas de recogida disponibles para un negocio',
      params: {
        type:       'object',
        required:   ['slug'],
        properties: { slug: { type: 'string' } },
      },
      response: {
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (req, reply) => {
    const { slug } = req.params

    const business = await app.prisma.business.findUnique({
      where:  { slug },
      select: { id: true },
    })
    if (!business) return reply.status(404).send({ error: 'not_found' })

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const windows = await app.prisma.pickupWindow.findMany({
      where: {
        businessId: business.id,
        isOpen:     true,
        date:       { gte: today },
      },
      select: {
        id:          true,
        date:        true,
        startTime:   true,
        endTime:     true,
        capacity:    true,
        ordersCount: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    return reply.send(
      windows.map((w) => ({
        id:          w.id,
        date:        w.date.toISOString(),
        startTime:   w.startTime,
        endTime:     w.endTime,
        capacity:    w.capacity,
        ordersCount: w.ordersCount,
        spotsLeft:   w.capacity - w.ordersCount,
      })),
    )
  })
}
