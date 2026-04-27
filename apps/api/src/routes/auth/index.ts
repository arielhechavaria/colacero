import type { FastifyInstance } from 'fastify'
import { loginRoute } from './login.js'
import { meRoute } from './me.js'

export async function authRoutes(app: FastifyInstance) {
  app.register(loginRoute)
  app.register(meRoute)
}
