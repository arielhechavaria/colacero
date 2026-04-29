import type { FastifyInstance } from 'fastify'
import { cartReserveRoutes }   from './reserve.js'
import { cartCheckoutRoutes }  from './checkout.js'
import { cartOrderRoutes }     from './order.js'

export async function cartRoutes(app: FastifyInstance) {
  app.register(cartReserveRoutes,  { prefix: '/reserve' })
  app.register(cartCheckoutRoutes)
  app.register(cartOrderRoutes)
}
