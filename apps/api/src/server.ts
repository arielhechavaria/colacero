import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import { prismaPlugin } from './plugins/prisma.js'

export function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env['NODE_ENV'] === 'test' ? 'silent' : 'info',
    },
  })

  // ── Plugins ──────────────────────────────────────────────────────────────
  app.register(sensible)
  app.register(prismaPlugin)

  // ── Health check — sin auth, sin DB ──────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    ts:     new Date().toISOString(),
  }))

  return app
}
