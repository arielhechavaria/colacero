import type { FastifyInstance } from 'fastify'
import { requestOtpRoute }     from './request-otp.js'
import { verifyOtpRoute }      from './verify-otp.js'
import { telegramAuthRoute }   from './telegram.js'
import { telegramWidgetRoute } from './telegram-widget.js'

export async function customerAuthRoutes(app: FastifyInstance) {
  app.register(requestOtpRoute)        // @deprecated — usar /telegram-widget o /telegram
  app.register(verifyOtpRoute)         // @deprecated
  app.register(telegramAuthRoute)      // Mini App (initData)
  app.register(telegramWidgetRoute)    // Web (Login Widget)
}
