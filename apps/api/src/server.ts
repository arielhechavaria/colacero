import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import cors from '@fastify/cors'
import { prismaPlugin } from './plugins/prisma.js'
import { authPlugin } from './plugins/auth.js'
import { redisPlugin } from './plugins/redis.js'
import { swaggerPlugin } from './plugins/swagger.js'
import { authRoutes } from './routes/auth/index.js'
import { customerAuthRoutes } from './routes/auth/customer/index.js'
import { productRoutes } from './routes/owner/products/index.js'
import { ownerOrderRoutes } from './routes/owner/orders/index.js'
import { catalogRoutes } from './routes/catalog/index.js'
import { cartRoutes } from './routes/cart/index.js'
import { uploadPlugin } from './plugins/upload.js'

export function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'test' ? 'silent' : 'info',
    },
  })

  // ── Plugins ──────────────────────────────────────────────────────────────
  app.register(cors, {
    origin:      process.env['CORS_ORIGIN'] ?? 'http://localhost:3001',
    credentials: true,
  })
  app.register(sensible)
  app.register(swaggerPlugin)
  app.register(prismaPlugin)
  app.register(redisPlugin)
  app.register(authPlugin)
  app.register(uploadPlugin)

  // ── Routes ───────────────────────────────────────────────────────────────
  app.register(authRoutes, { prefix: '/api/auth/owner' })
  app.register(customerAuthRoutes, { prefix: '/api/auth/customer' })
  app.register(productRoutes,    { prefix: '/api/owner/products' })
  app.register(ownerOrderRoutes, { prefix: '/api/owner/orders' })
  app.register(catalogRoutes, { prefix: '/api/catalog' })
  app.register(cartRoutes,    { prefix: '/api/cart' })

  // ── Health check — sin auth, sin DB ──────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    ts:     new Date().toISOString(),
  }))

  return app
}
