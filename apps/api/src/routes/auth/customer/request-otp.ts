import type { FastifyInstance } from 'fastify'
import { generateOtp, storeOtp } from '../../../services/otp.service.js'
import { createWhatsappProvider } from '../../../services/whatsapp.service.js'
import { env } from '@colacero/env'

const E164_PATTERN = /^\+[1-9]\d{7,14}$/

interface RequestOtpBody {
  phone: string
}

export async function requestOtpRoute(app: FastifyInstance) {
  const whatsapp = createWhatsappProvider(env.WHATSAPP_PROVIDER)

  app.post<{ Body: RequestOtpBody }>('/request-otp', {
    schema: {
      tags:    ['customer-auth'],
      summary: 'Solicitar OTP vía WhatsApp',
      body: {
        type:       'object',
        required:   ['phone'],
        properties: {
          phone: { type: 'string' },
        },
      },
      response: {
        200: {
          type:       'object',
          properties: {
            ok:       { type: 'boolean' },
            _devCode: { type: 'string' },  // solo presente en WHATSAPP_PROVIDER=mock
          },
        },
        422: {
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

    const { phone } = req.body

    if (!E164_PATTERN.test(phone)) {
      return reply.status(422).send({ error: 'validation_error' })
    }

    const otp = generateOtp()
    await storeOtp(app.redis, phone, otp, env.OTP_TTL_SECONDS)
    await whatsapp.sendOtp(phone, otp)

    // En modo mock devolvemos el código en la respuesta para poder testear
    const isMock = env.WHATSAPP_PROVIDER === 'mock'
    return reply.send({ ok: true, ...(isMock ? { _devCode: otp } : {}) })
  })
}
