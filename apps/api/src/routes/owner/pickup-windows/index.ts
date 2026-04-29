import type { FastifyInstance } from 'fastify'

interface WindowParams  { windowId: string }
interface WindowBody {
  date:      string   // YYYY-MM-DD
  startTime: string   // HH:MM
  endTime:   string   // HH:MM
  capacity:  number
  isOpen?:   boolean
}
interface WindowPatchBody {
  startTime?: string
  endTime?:   string
  capacity?:  number
  isOpen?:    boolean
}

export async function ownerPickupWindowRoutes(app: FastifyInstance) {

  // ── GET / — listar todas las ventanas del negocio ─────────────────────────
  app.get('/', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-windows'],
      summary:  'Listar ventanas de recogida del negocio',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const windows = await app.prisma.pickupWindow.findMany({
      where:   { businessId },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    return reply.send(windows.map(serialize))
  })

  // ── POST / — crear ventana ────────────────────────────────────────────────
  app.post<{ Body: WindowBody }>('/', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-windows'],
      summary:  'Crear ventana de recogida',
      security: [{ bearerAuth: [] }],
      body: {
        type:       'object',
        required:   ['date', 'startTime', 'endTime', 'capacity'],
        properties: {
          date:      { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          startTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          endTime:   { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          capacity:  { type: 'integer', minimum: 1 },
          isOpen:    { type: 'boolean' },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })
    if (req.validationError) return reply.status(422).send({ error: 'validation_error' })

    const { date, startTime, endTime, capacity, isOpen = true } = req.body

    const window = await app.prisma.pickupWindow.create({
      data: {
        businessId,
        date:      new Date(`${date}T00:00:00`),
        startTime,
        endTime,
        capacity,
        isOpen,
      },
    })

    return reply.status(201).send(serialize(window))
  })

  // ── PATCH /:windowId ──────────────────────────────────────────────────────
  app.patch<{ Params: WindowParams; Body: WindowPatchBody }>('/:windowId', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-windows'],
      summary:  'Actualizar ventana de recogida',
      security: [{ bearerAuth: [] }],
      body: {
        type:       'object',
        properties: {
          startTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          endTime:   { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          capacity:  { type: 'integer', minimum: 1 },
          isOpen:    { type: 'boolean' },
        },
      },
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const existing = await app.prisma.pickupWindow.findFirst({
      where: { id: req.params.windowId, businessId },
    })
    if (!existing) return reply.status(404).send({ error: 'not_found' })

    const updated = await app.prisma.pickupWindow.update({
      where: { id: req.params.windowId },
      data:  req.body,
    })

    return reply.send(serialize(updated))
  })

  // ── DELETE /:windowId ─────────────────────────────────────────────────────
  app.delete<{ Params: WindowParams }>('/:windowId', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-windows'],
      summary:  'Eliminar ventana de recogida',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const existing = await app.prisma.pickupWindow.findFirst({
      where: { id: req.params.windowId, businessId },
    })
    if (!existing) return reply.status(404).send({ error: 'not_found' })

    // No eliminar si tiene órdenes confirmadas
    if (existing.ordersCount > 0) {
      return reply.status(409).send({ error: 'window_has_orders' })
    }

    await app.prisma.pickupWindow.delete({ where: { id: req.params.windowId } })
    return reply.send({ ok: true })
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function serialize(w: {
  id:          string
  date:        Date
  startTime:   string
  endTime:     string
  capacity:    number
  ordersCount: number
  isOpen:      boolean
}) {
  return {
    id:          w.id,
    date:        w.date.toISOString().slice(0, 10),
    startTime:   w.startTime,
    endTime:     w.endTime,
    capacity:    w.capacity,
    ordersCount: w.ordersCount,
    spotsLeft:   w.capacity - w.ordersCount,
    isOpen:      w.isOpen,
  }
}
