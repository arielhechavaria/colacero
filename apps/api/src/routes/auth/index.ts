import type { FastifyInstance } from 'fastify'
import { loginRoute }             from './login.js'
import { meRoute }                from './me.js'
import { forgotPasswordRoute }    from './forgot-password.js'
import { resetPasswordRoute }     from './reset-password.js'
import { sendVerificationRoute }  from './send-verification.js'
import { verifyEmailRoute }       from './verify-email.js'
import { registerRoute }          from './register.js'
import { slugAvailableRoute }     from './slug-available.js'

export async function authRoutes(app: FastifyInstance) {
  app.register(loginRoute)
  app.register(meRoute)
  app.register(forgotPasswordRoute)
  app.register(resetPasswordRoute)
  app.register(sendVerificationRoute)
  app.register(verifyEmailRoute)
  app.register(registerRoute)
  app.register(slugAvailableRoute)
}
