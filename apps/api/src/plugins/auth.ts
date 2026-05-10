import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import { env } from '@colacero/env'
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { ACCESS_COOKIE } from '../services/token.service.js'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; businessId?: string; role?: string; phone?: string; telegramId?: string }
    user:    { sub: string; businessId?: string; role?: string; phone?: string; telegramId?: string }
  }
}

export const authPlugin = fp(async (app: FastifyInstance) => {
  app.register(jwt, {
    secret: env.JWT_SECRET,
    sign:   { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN },
    cookie: { cookieName: ACCESS_COOKIE, signed: false },
  })

  app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.unauthorized()
    }
  })
})
