import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import { prismaPlugin } from './plugins/prisma.js'
import { authPlugin } from './plugins/auth.js'
import { redisPlugin } from './plugins/redis.js'
import { swaggerPlugin } from './plugins/swagger.js'
import { authRoutes } from './routes/auth/index.js'
import { customerAuthRoutes } from './routes/auth/customer/index.js'
import { productRoutes } from './routes/owner/products/index.js'
import { catalogRoutes } from './routes/catalog/index.js'
import { uploadPlugin } from './plugins/upload.js'

export function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'test' ? 'silent' : 'info',
    },
  })

  // ── Plugins ──────────────────────────────────────────────────────────────
  app.register(sensible)
  app.register(swaggerPlugin)
  app.register(prismaPlugin)
  app.register(redisPlugin)
  app.register(authPlugin)
  app.register(uploadPlugin)

  // ── Routes ───────────────────────────────────────────────────────────────
  app.register(authRoutes, { prefix: '/api/auth/owner' })
  app.register(customerAuthRoutes, { prefix: '/api/auth/customer' })
  app.register(productRoutes, { prefix: '/api/owner/products' })
  app.register(catalogRoutes, { prefix: '/api/catalog' })

  // ── Health check — sin auth, sin DB ──────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    ts:     new Date().toISOString(),
  }))

  return app
}
