import fp from 'fastify-plugin'
import { Queue } from 'bullmq'
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
  // Reuse the existing Redis connection
  const connection = app.redis

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
  })
})
