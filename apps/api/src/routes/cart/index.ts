import type { FastifyInstance } from 'fastify'
import { cartReserveRoutes } from './reserve.js'

export async function cartRoutes(app: FastifyInstance) {
  app.register(cartReserveRoutes, { prefix: '/reserve' })
}
