import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { hashToken } from '../../services/token.service.js'
import { sendVerificationEmail } from '../../services/email.service.js'
import { env } from '@colacero/env'

export async function sendVerificationRoute(app: FastifyInstance) {
  app.post('/send-verification', {
    onRequest: [app.authenticate],
    schema: {
      tags:    ['auth'],
      summary: 'Enviar email de verificación al user autenticado',
      response: {
        200: {
          type:       'object',
          properties: {
            ok:              { type: 'boolean' },
            alreadyVerified: { type: 'boolean' },
          },
        },
      },
    },
  }, async (req, reply) => {
    const userId = req.user.sub
    if (!userId) return reply.status(401).send({ error: 'unauthorized' })

    const user = await app.prisma.user.findUnique({ where: { id: userId } })
    if (!user) return reply.status(404).send({ error: 'not_found' })

    if (user.emailVerifiedAt) {
      return reply.send({ ok: true, alreadyVerified: true })
    }

    // Invalidar tokens previos no usados
    await app.prisma.emailVerificationToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data:  { usedAt: new Date() },
    })

    const raw       = crypto.randomBytes(32).toString('base64url')
    const expiresAt = new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000)

    await app.prisma.emailVerificationToken.create({
      data: {
        userId:    user.id,
        tokenHash: hashToken(raw),
        expiresAt,
      },
    })

    const verifyLink = `${env.PANEL_URL}/verify-email?token=${raw}`

    await sendVerificationEmail({
      to:             user.email,
      verifyLink,
      expiresInHours: env.EMAIL_VERIFICATION_TTL_HOURS,
    })

    return reply.send({ ok: true, alreadyVerified: false })
  })
}
