import { createHmac } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { env } from '@colacero/env'

// ── Tipos de Telegram ─────────────────────────────────────────────────────────

interface TelegramUser {
  id:         number
  first_name: string
  last_name?: string
  username?:  string
  photo_url?: string
}

// ── Validación de initData (spec oficial de Telegram) ─────────────────────────

function parseTelegramInitData(
  initData: string,
  botToken: string,
): TelegramUser | null {
  try {
    const params = new URLSearchParams(initData)
    const hash = params.get('hash')
    if (!hash) return null

    // El auth_date no puede tener más de 1 hora de antigüedad
    const authDate = Number(params.get('auth_date') ?? '0')
    if (Date.now() / 1000 - authDate > 3600) return null

    params.delete('hash')

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    const secretKey = createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest()

    const expectedHash = createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex')

    if (hash !== expectedHash) return null

    const userJson = params.get('user')
    if (!userJson) return null

    return JSON.parse(userJson) as TelegramUser
  } catch {
    return null
  }
}

// ── Ruta ──────────────────────────────────────────────────────────────────────

interface TelegramAuthBody {
  initData: string
}

export async function telegramAuthRoute(app: FastifyInstance) {
  app.post<{ Body: TelegramAuthBody }>('/telegram', {
    schema: {
      tags:    ['customer-auth'],
      summary: 'Auth vía Telegram Mini App initData',
      body: {
        type:       'object',
        required:   ['initData'],
        properties: {
          initData: { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token:    { type: 'string' },
            customer: {
              type: 'object',
              properties: {
                id:          { type: 'string' },
                telegramId:  { type: 'string' },
                displayName: { type: 'string', nullable: true },
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

    const botToken = env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return reply.status(500).send({ error: 'telegram_not_configured' })
    }

    const tgUser = parseTelegramInitData(req.body.initData, botToken)
    if (!tgUser) {
      return reply.status(401).send({ error: 'invalid_init_data' })
    }

    const telegramId  = String(tgUser.id)
    const displayName = [tgUser.first_name, tgUser.last_name]
      .filter(Boolean)
      .join(' ') || null

    const customer = await app.prisma.customer.upsert({
      where:  { telegramId },
      update: { displayName, lastLoginAt: new Date() },
      create: { telegramId, displayName, lastLoginAt: new Date() },
    })

    const token = app.jwt.sign({
      sub: customer.id,
      ...(customer.telegramId ? { telegramId: customer.telegramId } : {}),
    })

    return reply.send({
      token,
      customer: {
        id:          customer.id,
        telegramId:  customer.telegramId,
        displayName: customer.displayName,
      },
    })
  })
}
