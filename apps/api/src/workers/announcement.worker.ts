import { Worker } from 'bullmq'
import type { Redis } from 'ioredis'
import type { PrismaClient } from '@colacero/db'
import type { TelegramProvider } from '../services/telegram.service.js'
import {
  generateAnnouncementPng,
  buildImageDataFromAnnouncement,
} from '../services/announcement-image.service.js'

export interface AnnouncementJob {
  businessId:      string
  text:            string
  announcementId?: string  // opcional para backwards compat
}

export const ANNOUNCEMENT_QUEUE = 'announcements'

/**
 * Si el anuncio no tiene PNG, lo genera y lo guarda en la DB.
 * Best-effort: si falla, devuelve null y se envía como texto.
 */
async function ensurePng(
  prisma:         PrismaClient,
  announcementId: string,
): Promise<string | null> {
  const a = await prisma.announcement.findUnique({
    where: { id: announcementId },
    include: { business: { select: { name: true, slug: true } } },
  })
  if (!a) return null
  if (a.generatedPng) return a.generatedPng

  try {
    // Cargar productos referenciados
    let productsForImage: { name: string; unitPrice: number | string; unitLabel: string }[] = []
    if (a.productIds.length > 0) {
      const prods = await prisma.product.findMany({
        where: { id: { in: a.productIds }, businessId: a.businessId },
      })
      productsForImage = prods.map((p) => ({
        name:      p.name,
        unitPrice: Number(p.unitPrice),
        unitLabel: p.unitLabel,
      }))
    }

    const imageData = buildImageDataFromAnnouncement({
      text:     a.text,
      template: a.template,
      business: { name: a.business.name, slug: a.business.slug },
      products: productsForImage,
    })

    const { absoluteUrl } = await generateAnnouncementPng(a.id, imageData)

    await prisma.announcement.update({
      where: { id: a.id },
      data:  { generatedPng: absoluteUrl },
    })

    return absoluteUrl
  } catch (err) {
    console.error(`[worker] PNG auto-generation failed for ${announcementId}:`, err)
    return null
  }
}

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
        // Auto-generar PNG si no existe (failsafe — el user no tiene que clickear)
        let pngUrl: string | null = null
        if (announcementId && prisma) {
          pngUrl = await ensurePng(prisma, announcementId)
        }

        if (pngUrl) {
          // Caption corto (Telegram limita a 1024 chars)
          const caption = text.length <= 1024 ? text : text.slice(0, 1020) + '…'
          await telegram.sendChannelPhoto(pngUrl, caption)
        } else {
          // Fallback: texto plano si PNG falló o no hay announcementId
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
