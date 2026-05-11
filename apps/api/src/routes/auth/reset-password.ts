import type { FastifyInstance } from 'fastify'
import { hashToken, revokeAllForUser } from '../../services/token.service.js'
import { hashPassword } from '../../services/auth.service.js'

interface ResetPasswordBody {
  token:       string
  newPassword: string
}

export async function resetPasswordRoute(app: FastifyInstance) {
  app.post<{ Body: ResetPasswordBody }>('/reset-password', {
    schema: {
      tags:    ['auth'],
      summary: 'Cambiar contraseña usando token de reset — invalida refresh tokens previos',
      body: {
        type:       'object',
        required:   ['token', 'newPassword'],
        properties: {
          token:       { type: 'string' },
          newPassword: { type: 'string', minLength: 10 },
        },
      },
      response: {
        200: {
          type:       'object',
          properties: { ok: { type: 'boolean' } },
        },
        400: {
          type:       'object',
          properties: { error: { type: 'string', enum: ['token_invalid_or_expired'] } },
        },
        422: {
          type:       'object',
          properties: { error: { type: 'string', enum: ['validation_error'] } },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    if (req.validationError) {
      return reply.status(422).send({ error: 'validation_error' })
    }

    const { token, newPassword } = req.body
    const row = await app.prisma.passwordResetToken.findUnique({
      where: { tokenHash: hashToken(token) },
    })

    if (!row || row.usedAt || row.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'token_invalid_or_expired' })
    }

    const passwordHash = await hashPassword(newPassword)

    // Actualizar password + marcar token como usado en una transacción
    await app.prisma.$transaction([
      app.prisma.user.update({
        where: { id: row.userId },
        data:  { passwordHash },
      }),
      app.prisma.passwordResetToken.update({
        where: { id: row.id },
        data:  { usedAt: new Date() },
      }),
    ])

    // Revocar todos los refresh tokens del usuario (fuera de transacción — updateMany no es transaccionable en Prisma)
    await revokeAllForUser(app.prisma, row.userId)

    return reply.send({ ok: true })
  })
}
