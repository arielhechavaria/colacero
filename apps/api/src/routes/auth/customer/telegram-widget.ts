import { createHash, createHmac } from 'crypto'
import type { FastifyInstance } from 'fastify'
import { env } from '@colacero/env'
import { issueRefreshToken } from '../../../services/token.service.js'
import { setAuthCookies } from '../../../utils/cookies.js'

// ── Tipos del widget (https://core.telegram.org/widgets/login) ────────────────

interface WidgetBody {
  id:          number
  first_name:  string
  last_name?:  string
  username?:   string
  photo_url?:  string
  auth_date:   number
  hash:        string
}

// ── Validación del payload del Login Widget ───────────────────────────────────
//
// El widget firma con HMAC-SHA256 usando como key el SHA256 (raw) del bot_token.
// IMPORTANTE: es distinto al pattern de Mini App initData (que usa HMAC-SHA256
// con 'WebAppData' como key inicial). No confundir.
//
// Algoritmo oficial:
//   1) data_check_string = sorted(["{k}={v}" for (k,v) in fields if k != 'hash']).join('\n')
//   2) secret_key = SHA256(bot_token)   ← raw bytes, NO hex
//   3) expected   = HMAC-SHA256(secret_key, data_check_string)
//   4) válido si expected == hash
//
function verifyWidgetSignature(body: WidgetBody, botToken: string): boolean {
  const { hash, ...fields } = body

  // Construir data_check_string: campos no-null/undefined, ordenados alfabéticamente
  const dataCheckString = Object.entries(fields)
    .filter(([_, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${String(v)}`)
    .join('\n')

  const secretKey  = createHash('sha256').update(botToken).digest()
  const expected   = createHmac('sha256', secretKey).update(dataCheckString).digest('hex')

  return expected === hash
}

// ── Ruta ──────────────────────────────────────────────────────────────────────

export async function telegramWidgetRoute(app: FastifyInstance) {
  app.post<{ Body: WidgetBody }>('/telegram-widget', {
    config: {
      // Rate limit más estricto que el global: 10 intentos / 15 min por IP
      rateLimit: { max: 10, timeWindow: '15 minutes' },
    },
    schema: {
      tags:    ['customer-auth'],
      summary: 'Auth vía Telegram Login Widget (web no-Mini-App)',
      body: {
        type:     'object',
        required: ['id', 'first_name', 'auth_date', 'hash'],
        properties: {
          id:         { type: 'integer' },
          first_name: { type: 'string' },
          last_name:  { type: 'string' },
          username:   { type: 'string' },
          photo_url:  { type: 'string' },
          auth_date:  { type: 'integer' },
          hash:       { type: 'string' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            customer: {
              type:       'object',
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

    // TELEGRAM_AUTH_BOT_TOKEN es el bot de plataforma (ej. @Colacero) usado solo para
    // validar el Login Widget. Fallback a TELEGRAM_BOT_TOKEN para entornos que
    // no hayan migrado todavía a la configuración de dos tokens.
    const botToken = env.TELEGRAM_AUTH_BOT_TOKEN ?? env.TELEGRAM_BOT_TOKEN
    if (!botToken) {
      return reply.status(503).send({ error: 'telegram_not_configured' })
    }

    // 1) Verificar firma HMAC
    if (!verifyWidgetSignature(req.body, botToken)) {
      return reply.status(401).send({ error: 'invalid_hash' })
    }

    // 2) Validar antigüedad: auth_date no más viejo de 5 minutos
    //    (Telegram permite hasta 24h, pero más estricto = mejor protección replay)
    const ageSeconds = Math.floor(Date.now() / 1000) - req.body.auth_date
    if (ageSeconds < 0 || ageSeconds > 300) {
      return reply.status(401).send({ error: 'auth_expired' })
    }

    // 3) Upsert Customer
    const telegramId  = String(req.body.id)
    const displayName = [req.body.first_name, req.body.last_name]
      .filter(Boolean)
      .join(' ')
      .trim() || null

    const customer = await app.prisma.customer.upsert({
      where:  { telegramId },
      update: { displayName, lastLoginAt: new Date() },
      create: { telegramId, displayName, lastLoginAt: new Date() },
    })

    // 4) Emitir tokens + cookies
    const accessToken = app.jwt.sign({
      sub: customer.id,
      ...(customer.telegramId ? { telegramId: customer.telegramId } : {}),
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
      customer: {
        id:          customer.id,
        telegramId:  customer.telegramId,
        displayName: customer.displayName,
      },
    })
  })
}
