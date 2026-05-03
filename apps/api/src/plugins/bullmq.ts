import fp from 'fastify-plugin'
import { Queue } from 'bullmq'
import { Redis } from 'ioredis'
import type { FastifyInstance } from 'fastify'
import { env } from '@colacero/env'
import { createTelegramProvider } from '../services/telegram.service.js'
import { createAnnouncementWorker, ANNOUNCEMENT_QUEUE } from '../workers/announcement.worker.js'
import { createNotificationWorker, NOTIFICATION_QUEUE, type NotifJobData } from '../workers/notification.worker.js'

declare module 'fastify' {
  interface FastifyInstance {
    queue:      Queue
    notifQueue: Queue<NotifJobData>
  }
}

export const bullmqPlugin = fp(async (app: FastifyInstance) => {
  // BullMQ requires maxRetriesPerRequest: null for blocking commands (BRPOP).
  const connection = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    lazyConnect:          true,
  })

  // Silence connection errors in test — the worker teardown fires close events
  // that aren't relevant to test assertions.
  connection.on('error', (err: Error) => {
    if (env.NODE_ENV !== 'test') {
      app.log.error({ err }, '[BullMQ Redis] connection error')
    }
  })

  await connection.connect()

  const queue      = new Queue(ANNOUNCEMENT_QUEUE,  { connection })
  const notifQueue = new Queue<NotifJobData>(NOTIFICATION_QUEUE, { connection })
  app.decorate('queue',      queue)
  app.decorate('notifQueue', notifQueue)

  // Don't start the worker in test mode — avoids teardown race conditions
  // where the connection close event fires after the test has ended.
  if (env.NODE_ENV !== 'test') {
    const telegram = createTelegramProvider(
      env.TELEGRAM_PROVIDER,
      env.TELEGRAM_BOT_TOKEN,
      env.TELEGRAM_CHANNEL_ID,
    )

    const announcementWorker  = createAnnouncementWorker(connection, telegram)
    const notificationWorker  = createNotificationWorker(connection, telegram)

    app.addHook('onClose', async () => {
      await announcementWorker.close()
      await notificationWorker.close()
    })
  }

  app.addHook('onClose', async () => {
    await queue.close()
    await notifQueue.close()
    await connection.quit()
  })
})
