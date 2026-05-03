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
import { ownerOrderRoutes }        from './routes/owner/orders/index.js'
import { ownerPickupWindowRoutes }  from './routes/owner/pickup-windows/index.js'
import { ownerAnnouncementRoutes }  from './routes/owner/announcements/index.js'
import { ownerStatsRoutes }         from './routes/owner/stats/index.js'
import { catalogRoutes } from './routes/catalog/index.js'
import { cartRoutes } from './routes/cart/index.js'
import { uploadPlugin } from './plugins/upload.js'
import { bullmqPlugin } from './plugins/bullmq.js'

export function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'test' ? 'silent' : 'info',
    },
  })

  // ── Plugins ──────────────────────────────────────────────────────────────
  // Support comma-separated origins: CORS_ORIGIN=http://localhost:3001,http://localhost:3002
  const rawOrigins = process.env['CORS_ORIGIN'] ?? 'http://localhost:3001,http://localhost:3002'
  const allowedOrigins = rawOrigins.split(',').map((o) => o.trim())

  app.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true,
  })
  app.register(sensible)
  app.register(swaggerPlugin)
  app.register(prismaPlugin)
  app.register(redisPlugin)
  app.register(authPlugin)
  app.register(uploadPlugin)
  app.register(bullmqPlugin)

  // ── Routes ───────────────────────────────────────────────────────────────
  app.register(authRoutes, { prefix: '/api/auth/owner' })
  app.register(customerAuthRoutes, { prefix: '/api/auth/customer' })
  app.register(productRoutes,    { prefix: '/api/owner/products' })
  app.register(ownerOrderRoutes,        { prefix: '/api/owner/orders' })
  app.register(ownerPickupWindowRoutes, { prefix: '/api/owner/pickup-windows' })
  app.register(ownerAnnouncementRoutes, { prefix: '/api/owner/announcements' })
  app.register(ownerStatsRoutes,        { prefix: '/api/owner/stats' })
  app.register(catalogRoutes, { prefix: '/api/catalog' })
  app.register(cartRoutes,    { prefix: '/api/cart' })

  // ── Health check — sin auth, sin DB ──────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    ts:     new Date().toISOString(),
  }))

  return app
}
