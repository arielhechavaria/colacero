import type { FastifyInstance } from 'fastify'
import { crudRoutes } from './crud.js'
import { inventoryRoutes } from './inventory.js'

export async function productRoutes(app: FastifyInstance) {
  app.register(crudRoutes)
  app.register(inventoryRoutes)
}
