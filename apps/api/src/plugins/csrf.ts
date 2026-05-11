import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { CSRF_COOKIE, ACCESS_COOKIE } from '../services/token.service.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const SKIP_PATHS = [
  '/api/auth/owner/login',
  '/api/auth/owner/forgot-password',
  '/api/auth/owner/reset-password',
  '/api/auth/customer/telegram',
  '/api/auth/customer/request-otp',
  '/api/auth/customer/verify-otp',
  '/api/auth/refresh',
]

// Prefix-based skip: covers POST /api/cart/reserve AND DELETE /api/cart/reserve/:id
// These are public endpoints (no session) — CSRF is irrelevant for them
const SKIP_PREFIXES = [
  '/api/cart/reserve',
]

export const csrfPlugin = fp(async (app: FastifyInstance) => {
  app.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    if (SAFE_METHODS.has(req.method))                              return
    if (SKIP_PATHS.includes(req.url))                              return
    if (SKIP_PREFIXES.some(p => req.url.startsWith(p)))           return
    // Public catalog routes don't carry a session cookie — let them through
    if (req.url.startsWith('/api/catalog/') && !req.cookies[ACCESS_COOKIE]) return

    const cookieToken = req.cookies[CSRF_COOKIE]
    const headerToken = req.headers['x-csrf-token']
    if (!cookieToken || typeof headerToken !== 'string' || headerToken !== cookieToken) {
      reply.code(403).send({ error: 'csrf_invalid' })
      return reply
    }
  })
})
