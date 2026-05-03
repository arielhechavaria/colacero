import type { FastifyInstance } from 'fastify'
import { hashPassword, verifyPassword } from '../../../services/auth.service.js'

const ALLOWED_TIMEZONES = [
  'America/Havana',
  'America/New_York',
  'America/Chicago',
  'America/Mexico_City',
  'America/Bogota',
  'America/Lima',
  'America/Caracas',
  'America/La_Paz',
  'America/Guayaquil',
  'America/Santiago',
  'America/Buenos_Aires',
  'America/Montevideo',
  'America/Asuncion',
  'UTC',
]

interface BusinessPatchBody {
  name?:        string
  description?: string
  timezone?:    string
}

interface StaffCreateBody {
  email:    string
  password: string
  role?:    string
}

interface PasswordPatchBody {
  currentPassword: string
  newPassword:     string
}

interface StaffParams { userId: string }

export async function ownerSettingsRoutes(app: FastifyInstance) {

  // ── GET /api/owner/settings/business ────────────────────────────────────────
  app.get('/business', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-settings'],
      summary:  'Obtener perfil del negocio',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const business = await app.prisma.business.findUnique({
      where:  { id: businessId },
      select: {
        id:                 true,
        name:               true,
        slug:               true,
        description:        true,
        timezone:           true,
        subscriptionStatus: true,
      },
    })

    if (!business) return reply.status(404).send({ error: 'not_found' })
    return reply.send(business)
  })

  // ── PATCH /api/owner/settings/business ──────────────────────────────────────
  app.patch<{ Body: BusinessPatchBody }>('/business', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-settings'],
      summary:  'Actualizar perfil del negocio (solo OWNER)',
      security: [{ bearerAuth: [] }],
      body: {
        type:       'object',
        properties: {
          name:        { type: 'string', minLength: 1, maxLength: 100 },
          description: { type: 'string', maxLength: 500 },
          timezone:    { type: 'string', enum: ALLOWED_TIMEZONES },
        },
      },
    },
  }, async (req, reply) => {
    const { businessId, role } = req.user
    if (!businessId)       return reply.status(403).send({ error: 'forbidden' })
    if (role !== 'OWNER')  return reply.status(403).send({ error: 'owner_only' })

    const { name, description, timezone } = req.body

    const updated = await app.prisma.business.update({
      where: { id: businessId },
      data:  {
        ...(name        !== undefined ? { name }        : {}),
        ...(description !== undefined ? { description } : {}),
        ...(timezone    !== undefined ? { timezone }    : {}),
      },
      select: {
        id:                 true,
        name:               true,
        slug:               true,
        description:        true,
        timezone:           true,
        subscriptionStatus: true,
      },
    })

    return reply.send(updated)
  })

  // ── GET /api/owner/settings/staff ───────────────────────────────────────────
  app.get('/staff', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-settings'],
      summary:  'Listar miembros del equipo',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const users = await app.prisma.user.findMany({
      where:   { businessId },
      orderBy: { createdAt: 'asc' },
      select:  {
        id:        true,
        email:     true,
        role:      true,
        createdAt: true,
      },
    })

    return reply.send(users.map((u) => ({
      id:        u.id,
      email:     u.email,
      role:      u.role,
      createdAt: u.createdAt.toISOString(),
    })))
  })

  // ── POST /api/owner/settings/staff ──────────────────────────────────────────
  app.post<{ Body: StaffCreateBody }>('/staff', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-settings'],
      summary:  'Agregar miembro del equipo (solo OWNER)',
      security: [{ bearerAuth: [] }],
      body: {
        type:       'object',
        required:   ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          role:     { type: 'string', enum: ['OWNER', 'STAFF'] },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    const { businessId, role } = req.user
    if (!businessId)      return reply.status(403).send({ error: 'forbidden' })
    if (role !== 'OWNER') return reply.status(403).send({ error: 'owner_only' })
    if (req.validationError) return reply.status(422).send({ error: 'validation_error' })

    const email       = req.body.email.toLowerCase()
    const memberRole  = req.body.role ?? 'STAFF'
    const passwordHash = await hashPassword(req.body.password)

    try {
      const user = await app.prisma.user.create({
        data: {
          businessId,
          email,
          passwordHash,
          role: memberRole as 'OWNER' | 'STAFF',
        },
        select: {
          id:        true,
          email:     true,
          role:      true,
          createdAt: true,
        },
      })

      return reply.status(201).send({
        id:        user.id,
        email:     user.email,
        role:      user.role,
        createdAt: user.createdAt.toISOString(),
      })
    } catch (err: unknown) {
      const e = err as { code?: string }
      if (e?.code === 'P2002') {
        return reply.status(409).send({ error: 'email_already_exists' })
      }
      throw err
    }
  })

  // ── DELETE /api/owner/settings/staff/:userId ─────────────────────────────────
  app.delete<{ Params: StaffParams }>('/staff/:userId', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-settings'],
      summary:  'Eliminar miembro del equipo (solo OWNER)',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId, role, sub } = req.user
    if (!businessId)      return reply.status(403).send({ error: 'forbidden' })
    if (role !== 'OWNER') return reply.status(403).send({ error: 'owner_only' })

    const { userId } = req.params

    if (userId === sub) return reply.status(400).send({ error: 'cannot_delete_self' })

    const target = await app.prisma.user.findFirst({
      where: { id: userId, businessId },
    })
    if (!target) return reply.status(404).send({ error: 'not_found' })

    await app.prisma.user.delete({ where: { id: userId } })
    return reply.status(204).send()
  })

  // ── PATCH /api/owner/settings/password ──────────────────────────────────────
  app.patch<{ Body: PasswordPatchBody }>('/password', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-settings'],
      summary:  'Cambiar contraseña propia',
      security: [{ bearerAuth: [] }],
      body: {
        type:       'object',
        required:   ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string', minLength: 1 },
          newPassword:     { type: 'string', minLength: 8 },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    const { sub } = req.user
    if (!sub) return reply.status(403).send({ error: 'forbidden' })
    if (req.validationError) return reply.status(422).send({ error: 'validation_error' })

    const user = await app.prisma.user.findUnique({ where: { id: sub } })
    if (!user) return reply.status(404).send({ error: 'not_found' })

    const valid = await verifyPassword(req.body.currentPassword, user.passwordHash)
    if (!valid) return reply.status(401).send({ error: 'wrong_password' })

    const newHash = await hashPassword(req.body.newPassword)
    await app.prisma.user.update({
      where: { id: sub },
      data:  { passwordHash: newHash },
    })

    return reply.status(204).send()
  })
}
