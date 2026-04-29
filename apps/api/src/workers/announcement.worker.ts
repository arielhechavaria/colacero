import { Worker } from 'bullmq'
import type { Redis } from 'ioredis'
import type { TelegramProvider } from '../services/telegram.service.js'

export interface AnnouncementJob {
  businessId: string
  text:       string
}

export const ANNOUNCEMENT_QUEUE = 'announcements'

export function createAnnouncementWorker(
  redis:    Redis,
  telegram: TelegramProvider,
): Worker {
  const worker = new Worker<AnnouncementJob>(
    ANNOUNCEMENT_QUEUE,
    async (job) => {
      const { text } = job.data
      await telegram.sendChannelMessage(text)
    },
    {
      connection: redis,
      concurrency: 2,
    },
  )

  worker.on('completed', (job) => {
    console.log(`[BullMQ] announcement job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ] announcement job ${job?.id} failed:`, err.message)
  })

  return worker
}
