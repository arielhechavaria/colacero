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

  // ── POST /generate-tomorrow — copiar ventanas de hoy para mañana ─────────
  app.post('/generate-tomorrow', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-windows'],
      summary:  'Generar ventanas para mañana copiando las de hoy',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const todayWindows = await app.prisma.pickupWindow.findMany({
      where: {
        businessId,
        date: { gte: todayStart, lte: todayEnd },
      },
    })

    if (todayWindows.length === 0) {
      return reply.status(404).send({ error: 'no_windows_today' })
    }

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    // Delete existing tomorrow windows to avoid duplicates
    await app.prisma.pickupWindow.deleteMany({
      where: {
        businessId,
        date: tomorrow,
      },
    })

    const created = await Promise.all(
      todayWindows.map((w) =>
        app.prisma.pickupWindow.create({
          data: {
            businessId,
            date:      tomorrow,
            startTime: w.startTime,
            endTime:   w.endTime,
            capacity:  w.capacity,
            isOpen:    true,
          },
        }),
      ),
    )

    return reply.status(201).send({
      date:    tomorrow.toISOString().slice(0, 10),
      created: created.map(serialize),
    })
  })

  // ── POST /generate-schedule — generar horario L-V 8am-5pm 30 días ─────────
  app.post('/generate-schedule', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-windows'],
      summary:  'Generar ventanas L-V 8:00-17:00 para los próximos 30 días',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    // Calcular los días laborales de los próximos 30 días
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const workdays: Date[] = []
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dow = d.getDay()
      if (dow !== 0 && dow !== 6) workdays.push(d)  // omitir sábado(6) y domingo(0)
    }

    // Obtener fechas que ya tienen al menos una ventana
    const existing = await app.prisma.pickupWindow.findMany({
      where: {
        businessId,
        date: { gte: today },
      },
      select: { date: true },
    })
    const existingSet = new Set(
      existing.map((w) => w.date.toISOString().slice(0, 10)),
    )

    // Crear solo los días que aún no tienen ventana
    const toCreate = workdays.filter(
      (d) => !existingSet.has(d.toISOString().slice(0, 10)),
    )

    const created = await Promise.all(
      toCreate.map((d) =>
        app.prisma.pickupWindow.create({
          data: {
            businessId,
            date:      d,
            startTime: '08:00',
            endTime:   '17:00',
            capacity:  20,
            isOpen:    true,
          },
        }),
      ),
    )

    return reply.status(201).send({
      created: created.map(serialize),
      skipped: workdays.length - toCreate.length,
    })
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

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
