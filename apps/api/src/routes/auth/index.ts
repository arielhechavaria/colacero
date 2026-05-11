import type { FastifyInstance } from 'fastify'
import { loginRoute }          from './login.js'
import { meRoute }             from './me.js'
import { forgotPasswordRoute } from './forgot-password.js'
import { resetPasswordRoute }  from './reset-password.js'

export async function authRoutes(app: FastifyInstance) {
  app.register(loginRoute)
  app.register(meRoute)
  app.register(forgotPasswordRoute)
  app.register(resetPasswordRoute)
}
