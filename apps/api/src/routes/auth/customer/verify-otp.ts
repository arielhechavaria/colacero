import type { FastifyInstance } from 'fastify'
import { verifyAndConsumeOtp } from '../../../services/otp.service.js'

interface VerifyOtpBody {
  phone: string
  otp:   string
}

export async function verifyOtpRoute(app: FastifyInstance) {
  app.post<{ Body: VerifyOtpBody }>('/verify-otp', {
    schema: {
      tags:    ['customer-auth'],
      summary: 'Verificar OTP y obtener token de acceso',
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
            token:    { type: 'string' },
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

    const token = app.jwt.sign({
      sub: customer.id,
      ...(customer.phone ? { phone: customer.phone } : {}),
    })

    return reply.send({
      token,
      customer: { id: customer.id, phone: customer.phone },
    })
  })
}
