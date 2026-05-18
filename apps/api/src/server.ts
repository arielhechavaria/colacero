import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env } from '@colacero/env'
import { prismaPlugin } from './plugins/prisma.js'
import { authPlugin } from './plugins/auth.js'
import { csrfPlugin } from './plugins/csrf.js'
import { rateLimitPlugin } from './plugins/rate-limit.js'
import { redisPlugin } from './plugins/redis.js'
import { swaggerPlugin } from './plugins/swagger.js'
import { authRoutes } from './routes/auth/index.js'
import { refreshRoute }   from './routes/auth/refresh.js'
import { logoutRoute }    from './routes/auth/logout.js'
import { logoutAllRoute } from './routes/auth/logout-all.js'
import { customerAuthRoutes } from './routes/auth/customer/index.js'
import { productRoutes } from './routes/owner/products/index.js'
import { ownerOrderRoutes }        from './routes/owner/orders/index.js'
import { ownerPickupWindowRoutes }  from './routes/owner/pickup-windows/index.js'
import { ownerAnnouncementRoutes }  from './routes/owner/announcements/index.js'
import { ownerStatsRoutes }         from './routes/owner/stats/index.js'
import { ownerCustomerRoutes }      from './routes/owner/customers/index.js'
import { ownerSettingsRoutes }      from './routes/owner/settings/index.js'
import { catalogRoutes } from './routes/catalog/index.js'
import { cartRoutes } from './routes/cart/index.js'
import { adminBusinessRoutes } from './routes/admin/businesses.js'
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
    credentials:    true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
  app.register(cookie, { secret: env.COOKIE_SECRET, parseOptions: {} })
  app.register(sensible)
  app.register(swaggerPlugin)
  app.register(prismaPlugin)
  app.register(redisPlugin)
  app.register(rateLimitPlugin)
  app.register(authPlugin)
  app.register(csrfPlugin)
  app.register(uploadPlugin)
  app.register(bullmqPlugin)

  // ── Routes ───────────────────────────────────────────────────────────────
  app.register(authRoutes, { prefix: '/api/auth/owner' })
  app.register(async (group) => {
    group.register(refreshRoute)
    group.register(logoutRoute)
    group.register(logoutAllRoute)
  }, { prefix: '/api/auth' })
  app.register(customerAuthRoutes, { prefix: '/api/auth/customer' })
  app.register(productRoutes,    { prefix: '/api/owner/products' })
  app.register(ownerOrderRoutes,        { prefix: '/api/owner/orders' })
  app.register(ownerPickupWindowRoutes, { prefix: '/api/owner/pickup-windows' })
  app.register(ownerAnnouncementRoutes, { prefix: '/api/owner/announcements' })
  app.register(ownerStatsRoutes,        { prefix: '/api/owner/stats' })
  app.register(ownerCustomerRoutes,     { prefix: '/api/owner/customers' })
  app.register(ownerSettingsRoutes,     { prefix: '/api/owner/settings' })
  app.register(catalogRoutes, { prefix: '/api/catalog' })
  app.register(cartRoutes,    { prefix: '/api/cart' })
  app.register(adminBusinessRoutes, { prefix: '/api/admin/businesses' })

  // ── Health check — sin auth, sin DB ──────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    ts:     new Date().toISOString(),
  }))

  // ── Landing HTML para la raíz de la API ─────────────────────
  // fileURLToPath convierte correctamente file:/// URLs a rutas nativas en
  // Windows (evita el bug C:\C:\ que produce new URL().pathname + path.join)
  const landingHtmlPath = fileURLToPath(new URL('../public/api-landing.html', import.meta.url))
  const landingHtml = fs.existsSync(landingHtmlPath)
    ? fs.readFileSync(landingHtmlPath, 'utf8')
    : '<h1>ColaCero API</h1>'

    app.get('/', async (req, reply) => {
        return reply
            .type('text/html; charset=utf-8')
            .send(landingHtml)
    })


  return app
}
