import type { FastifyInstance } from 'fastify'
import { generateOtp, storeOtp } from '../../../services/otp.service.js'
import { createTelegramProvider } from '../../../services/telegram.service.js'
import { env } from '@colacero/env'

const E164_PATTERN = /^\+[1-9]\d{7,14}$/

// Nombre público del bot — idealmente en env; por ahora hardcodeado
const BOT_NAME = '@ColaCeroBot'

interface RequestOtpBody {
  phone: string
}

export async function requestOtpRoute(app: FastifyInstance) {
  const telegram = createTelegramProvider(
    env.TELEGRAM_PROVIDER,
    env.TELEGRAM_BOT_TOKEN,
    env.TELEGRAM_CHANNEL_ID,
  )

  app.post<{ Body: RequestOtpBody }>('/request-otp', {
    schema: {
      tags:    ['customer-auth'],
      summary: 'Solicitar OTP vía Telegram',
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
            ok:          { type: 'boolean' },
            _devCode:    { type: 'string' },   // solo en TELEGRAM_PROVIDER=mock
            requiresBot: { type: 'boolean' },  // true si el usuario no inició el bot
            botName:     { type: 'string' },   // nombre del bot a iniciar
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

    const isMock = env.TELEGRAM_PROVIDER === 'mock'

    if (isMock) {
      // En modo mock: loguear y devolver el código en la respuesta (para dev/tests)
      await telegram.sendDirectMessage('mock', otp)
      return reply.send({ ok: true, _devCode: otp })
    }

    // Modo bot-api: buscar el telegramId del customer para enviarle el DM
    const customer = await app.prisma.customer.findUnique({
      where:  { phone },
      select: { telegramId: true },
    })

    if (!customer?.telegramId) {
      // El usuario no ha iniciado el bot — indicarle que lo haga
      return reply.send({ ok: true, requiresBot: true, botName: BOT_NAME })
    }

    await telegram.sendDirectMessage(
      customer.telegramId,
      `🔑 Tu código de verificación ColaCero es: <b>${otp}</b>\n\nVálido por ${env.OTP_TTL_SECONDS / 60} minutos.`,
    )

    return reply.send({ ok: true })
  })
}
