import type { FastifyInstance } from 'fastify'
import { requestOtpRoute }  from './request-otp.js'
import { verifyOtpRoute }   from './verify-otp.js'
import { telegramAuthRoute } from './telegram.js'

export async function customerAuthRoutes(app: FastifyInstance) {
  app.register(requestOtpRoute)
  app.register(verifyOtpRoute)
  app.register(telegramAuthRoute)
}
