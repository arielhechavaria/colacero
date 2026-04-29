import fp from 'fastify-plugin'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'
import { env } from '@colacero/env'
import { createTelegramProvider } from '../services/telegram.service.js'
import { createAnnouncementWorker, ANNOUNCEMENT_QUEUE } from '../workers/announcement.worker.js'

declare module 'fastify' {
  interface FastifyInstance {
    queue: Queue
  }
}

export const bullmqPlugin = fp(async (app: FastifyInstance) => {
  // BullMQ requires its own Redis connection with maxRetriesPerRequest: null
  // because it uses blocking commands (BRPOP) that need unlimited wait time.
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect:          true,
  })
  await connection.connect()

  const queue = new Queue(ANNOUNCEMENT_QUEUE, { connection })

  const telegram = createTelegramProvider(
    env.TELEGRAM_PROVIDER,
    env.TELEGRAM_BOT_TOKEN,
    env.TELEGRAM_CHANNEL_ID,
  )

  const worker = createAnnouncementWorker(connection, telegram)

  app.decorate('queue', queue)

  app.addHook('onClose', async () => {
    await worker.close()
    await queue.close()
    await connection.quit()
  })
})
