import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { hashToken } from '../../services/token.service.js'
import { sendPasswordResetEmail } from '../../services/email.service.js'
import { env } from '@colacero/env'

interface ForgotPasswordBody {
  email: string
}

export async function forgotPasswordRoute(app: FastifyInstance) {
  app.post<{ Body: ForgotPasswordBody }>('/forgot-password', {
    schema: {
      tags:    ['auth'],
      summary: 'Solicitar link de reset de contraseña — siempre devuelve 200 (anti-enumeration)',
      body: {
        type:       'object',
        required:   ['email'],
        properties: {
          email: { type: 'string', format: 'email' },
        },
      },
      response: {
        200: {
          type:       'object',
          properties: { ok: { type: 'boolean' } },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    // Siempre 200 — no revelar si el email existe (anti-enumeration)
    if (req.validationError) {
      return reply.send({ ok: true })
    }

    const email = req.body.email.toLowerCase()
    const user  = await app.prisma.user.findFirst({ where: { email } })

    if (user) {
      // Invalidar tokens previos no usados
      await app.prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data:  { usedAt: new Date() },
      })

      const raw       = crypto.randomBytes(32).toString('base64url')
      const expiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60 * 1000)

      await app.prisma.passwordResetToken.create({
        data: {
          userId:    user.id,
          tokenHash: hashToken(raw),
          expiresAt,
        },
      })

      const resetLink = `${env.PANEL_URL}/reset-password?token=${raw}`

      await sendPasswordResetEmail({
        to:               email,
        resetLink,
        expiresInMinutes: env.PASSWORD_RESET_TTL_MINUTES,
      })
    }

    return reply.send({ ok: true })
  })
}
