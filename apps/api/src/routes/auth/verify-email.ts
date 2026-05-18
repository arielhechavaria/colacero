import type { FastifyInstance } from 'fastify'
import { hashToken } from '../../services/token.service.js'

interface VerifyEmailBody {
  token: string
}

export async function verifyEmailRoute(app: FastifyInstance) {
  app.post<{ Body: VerifyEmailBody }>('/verify-email', {
    schema: {
      tags:    ['auth'],
      summary: 'Verificar email usando token enviado por mail',
      body: {
        type:       'object',
        required:   ['token'],
        properties: { token: { type: 'string' } },
      },
      response: {
        200: {
          type:       'object',
          properties: {
            ok:    { type: 'boolean' },
            email: { type: 'string' },
          },
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

    const { token } = req.body
    const row = await app.prisma.emailVerificationToken.findUnique({
      where:   { tokenHash: hashToken(token) },
      include: { user: true },
    })

    if (!row || row.usedAt || row.expiresAt < new Date()) {
      return reply.status(400).send({ error: 'token_invalid_or_expired' })
    }

    await app.prisma.$transaction([
      app.prisma.user.update({
        where: { id: row.userId },
        data:  { emailVerifiedAt: new Date() },
      }),
      app.prisma.emailVerificationToken.update({
        where: { id: row.id },
        data:  { usedAt: new Date() },
      }),
    ])

    return reply.send({ ok: true, email: row.user.email })
  })
}
