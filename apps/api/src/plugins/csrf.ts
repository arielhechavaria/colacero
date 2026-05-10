import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { CSRF_COOKIE, ACCESS_COOKIE } from '../services/token.service.js'

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

const SKIP_PATHS = [
  '/api/auth/owner/login',
  '/api/auth/customer/telegram',
  '/api/auth/customer/request-otp',
  '/api/auth/customer/verify-otp',
  '/api/auth/refresh',
]

export const csrfPlugin = fp(async (app: FastifyInstance) => {
  app.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    if (SAFE_METHODS.has(req.method))            return
    if (SKIP_PATHS.includes(req.url))            return
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
