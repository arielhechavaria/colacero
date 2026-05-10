import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

/**
 * Rate limiting global + por ruta.
 *
 * En test mode se omite completamente (NODE_ENV=test) para no interferir con
 * los integration tests que acumulan requests desde 127.0.0.1. En producción
 * Cloudflare aporta el IP real vía CF-Connecting-IP / X-Forwarded-For.
 *
 * Por ruta: agregar `config: { rateLimit: { max, timeWindow } }` al route handler.
 * Ejemplo en login.ts:
 *   app.post('/login', { config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }, ... })
 */
export const rateLimitPlugin = fp(async (app: FastifyInstance) => {
  if (process.env['NODE_ENV'] === 'test') return

  await app.register(rateLimit, {
    global:     true,
    max:        100,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
    errorResponseBuilder: (_req, ctx) => ({
      error:      'rate_limit_exceeded',
      retryAfter: ctx.after,
    }),
  })
})
