import fp from 'fastify-plugin'
import { Redis } from 'ioredis'
import { env } from '@colacero/env'
import type { FastifyInstance } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
  }
}

export const redisPlugin = fp(async (app: FastifyInstance) => {
  const redis = new Redis(env.REDIS_URL, { lazyConnect: true })

  await redis.connect()

  app.decorate('redis', redis)

  app.addHook('onClose', async () => {
    await redis.quit()
  })
})
