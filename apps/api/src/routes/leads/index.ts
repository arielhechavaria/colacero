import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'

interface LeadBody {
  email:        string
  phone?:       string
  telegram?:    string
  businessKind?: string
  message?:     string
  source?:      string
}

interface LeadParams { id: string }

interface LeadPatchBody {
  status?: 'NEW' | 'CONTACTED' | 'TRIAL' | 'CONVERTED' | 'LOST'
  notes?:  string
}

async function requireSuperAdmin(req: FastifyRequest, reply: FastifyReply) {
  if (req.user?.role !== 'SUPER_ADMIN') {
    return reply.status(403).send({ error: 'forbidden_admin_only' })
  }
}

export async function leadRoutes(app: FastifyInstance) {
  // ── POST /api/leads (público) ──────────────────────────────────────────────
  app.post<{ Body: LeadBody }>('/', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
    schema: {
      tags:    ['leads'],
      summary: 'Captura pública de leads desde la landing',
      body: {
        type:       'object',
        required:   ['email'],
        properties: {
          email:        { type: 'string', format: 'email', maxLength: 200 },
          phone:        { type: 'string', maxLength: 50 },
          telegram:     { type: 'string', maxLength: 100 },
          businessKind: { type: 'string', maxLength: 200 },
          message:      { type: 'string', maxLength: 1000 },
          source:       { type: 'string', maxLength: 50 },
        },
      },
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' } } },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    // Siempre 200 (anti-bot enumeration)
    if (req.validationError) return reply.send({ ok: true })

    try {
      await app.prisma.lead.create({
        data: {
          email:        req.body.email.toLowerCase().trim(),
          phone:        req.body.phone?.trim()        || null,
          telegram:     req.body.telegram?.trim()     || null,
          businessKind: req.body.businessKind?.trim() || null,
          message:      req.body.message?.trim()      || null,
          source:       req.body.source ?? 'landing',
        },
      })
    } catch (err) {
      app.log.error({ err }, 'lead create failed')
    }

    return reply.send({ ok: true })
  })

  // ── GET /api/admin/leads ───────────────────────────────────────────────────
  app.get('/admin-list', {
    onRequest: [app.authenticate, requireSuperAdmin],
    schema:    { tags: ['admin'], summary: 'Listar leads' },
  }, async (_req, reply) => {
    const leads = await app.prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take:    200,
    })
    return reply.send(leads.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
      updatedAt: l.updatedAt.toISOString(),
    })))
  })

  // ── PATCH /api/admin/leads/:id ─────────────────────────────────────────────
  app.patch<{ Params: LeadParams; Body: LeadPatchBody }>('/admin-update/:id', {
    onRequest: [app.authenticate, requireSuperAdmin],
    schema: {
      tags:    ['admin'],
      summary: 'Actualizar status o notas de un lead',
      body: {
        type:       'object',
        properties: {
          status: { type: 'string', enum: ['NEW', 'CONTACTED', 'TRIAL', 'CONVERTED', 'LOST'] },
          notes:  { type: 'string', maxLength: 5000 },
        },
      },
    },
  }, async (req, reply) => {
    const updated = await app.prisma.lead.update({
      where: { id: req.params.id },
      data:  {
        ...(req.body.status !== undefined ? { status: req.body.status } : {}),
        ...(req.body.notes  !== undefined ? { notes:  req.body.notes }  : {}),
      },
    })
    return reply.send({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    })
  })
}
