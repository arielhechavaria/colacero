import type { FastifyInstance } from 'fastify'
import { verifyAndConsumeOtp } from '../../../services/otp.service.js'
import { issueRefreshToken } from '../../../services/token.service.js'
import { setAuthCookies } from '../../../utils/cookies.js'

interface VerifyOtpBody {
  phone: string
  otp:   string
}

export async function verifyOtpRoute(app: FastifyInstance) {
  app.post<{ Body: VerifyOtpBody }>('/verify-otp', {
    schema: {
      tags:    ['customer-auth'],
      summary: 'Verificar OTP y obtener cookies de sesión (cc_access, cc_refresh, cc_csrf)',
      body: {
        type:       'object',
        required:   ['phone', 'otp'],
        properties: {
          phone: { type: 'string' },
          otp:   { type: 'string', minLength: 6, maxLength: 6, pattern: '^\\d{6}$' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            customer: {
              type:       'object',
              properties: {
                id:    { type: 'string' },
                phone: { type: 'string' },
              },
            },
          },
        },
        401: {
          type:       'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    if (req.validationError) {
      return reply.status(422).send({ error: 'validation_error' })
    }

    const { phone, otp } = req.body

    const valid = await verifyAndConsumeOtp(app.redis, phone, otp)
    if (!valid) {
      return reply.status(401).send({ error: 'invalid_otp' })
    }

    const customer = await app.prisma.customer.upsert({
      where:  { phone },
      update: { lastLoginAt: new Date() },
      create: { phone, lastLoginAt: new Date() },
    })

    const accessToken = app.jwt.sign({
      sub: customer.id,
      ...(customer.phone ? { phone: customer.phone } : {}),
    })

    const pair = await issueRefreshToken(app.prisma, {
      customerId: customer.id,
      userAgent:  req.headers['user-agent'] ?? undefined,
      ipAddress:  req.ip,
    })

    setAuthCookies(reply, {
      accessToken,
      refreshToken: pair.refreshTokenRaw,
      csrfToken:    pair.csrfToken,
    })

    return reply.send({
      customer: { id: customer.id, phone: customer.phone },
    })
  })
}
