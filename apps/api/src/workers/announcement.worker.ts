import { Worker } from 'bullmq'
import type { Redis } from 'ioredis'
import type { PrismaClient } from '@colacero/db'
import type { TelegramProvider } from '../services/telegram.service.js'

export interface AnnouncementJob {
  businessId:      string
  text:            string
  announcementId?: string  // opcional para backwards compat
}

export const ANNOUNCEMENT_QUEUE = 'announcements'

export function createAnnouncementWorker(
  redis:    Redis,
  telegram: TelegramProvider,
  prisma?:  PrismaClient,
): Worker {
  const worker = new Worker<AnnouncementJob>(
    ANNOUNCEMENT_QUEUE,
    async (job) => {
      const { text, announcementId } = job.data

      try {
        // Si tenemos un PNG generado, mandarlo via sendPhoto con caption
        let sentAsPhoto = false
        if (announcementId && prisma) {
          const a = await prisma.announcement.findUnique({
            where:  { id: announcementId },
            select: { generatedPng: true },
          })
          if (a?.generatedPng) {
            // Caption corto (Telegram limita captions de fotos a 1024 chars)
            const caption = text.length <= 1024 ? text : text.slice(0, 1020) + '…'
            await telegram.sendChannelPhoto(a.generatedPng, caption)
            sentAsPhoto = true
          }
        }

        if (!sentAsPhoto) {
          await telegram.sendChannelMessage(text)
        }

        if (announcementId && prisma) {
          await prisma.announcement.update({
            where: { id: announcementId },
            data:  {
              status:       'SENT',
              sentAt:       new Date(),
              errorMessage: null,
            },
          })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)

        if (announcementId && prisma) {
          await prisma.announcement.update({
            where: { id: announcementId },
            data:  {
              status:       'FAILED',
              errorMessage: message,
            },
          }).catch(() => { /* swallow secondary error */ })
        }

        throw err
      }
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
