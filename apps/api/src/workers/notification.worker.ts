import { Worker } from 'bullmq'
import type { Redis } from 'ioredis'
import { createTelegramProvider } from '../services/telegram.service.js'
import { env } from '@colacero/env'

export const NOTIFICATION_QUEUE = 'notifications'

export type NotifJobData =
  | {
      type:         'business_new_order'
      chatId:       string
      botToken?:    string
      pickupCode:   string
      customerName: string
      itemsText:    string   // "Arroz × 2kg\nPollo × 1kg"
      windowTime:   string   // "10:00 – 12:00"
      total:        string   // "$45.00"
    }
  | {
      type:       'customer_ready'
      chatId:     string
      pickupCode: string
      endTime:    string   // "12:00"
    }

export function createNotificationWorker(
  redis: Redis,
): Worker {
  const worker = new Worker<NotifJobData>(
    NOTIFICATION_QUEUE,
    async (job) => {
      const data = job.data

      if (data.type === 'business_new_order') {
        const resolvedToken = data.botToken ?? env.TELEGRAM_BOT_TOKEN
        const provider = createTelegramProvider(
          resolvedToken ? 'bot-api' : 'mock',
          resolvedToken,
        )
        const text = [
          '🛒 <b>Nuevo pedido</b>',
          `📋 Código: <code>${data.pickupCode}</code>`,
          `👤 ${data.customerName}`,
          `📦 ${data.itemsText}`,
          `🕐 Ventana: ${data.windowTime}`,
          `💰 Total: ${data.total}`,
        ].join('\n')
        await provider.sendDirectMessage(data.chatId, text)
      }

      if (data.type === 'customer_ready') {
        // Customer notifications always use the platform bot
        const authToken = env.TELEGRAM_AUTH_BOT_TOKEN ?? env.TELEGRAM_BOT_TOKEN
        const provider = createTelegramProvider(
          authToken ? 'bot-api' : 'mock',
          authToken,
        )
        const text = [
          '✅ <b>¡Tu pedido está listo!</b>',
          `📋 Código de retiro: <code>${data.pickupCode}</code>`,
          `🕐 Retirá antes de las ${data.endTime} hs`,
          '¡Te esperamos!',
        ].join('\n')
        await provider.sendDirectMessage(data.chatId, text)
      }
    },
    {
      connection:  redis,
      concurrency: 5,
    },
  )

  worker.on('completed', (job) => {
    console.log(`[BullMQ] notification job ${job.id} (${job.data.type}) completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`[BullMQ] notification job ${job?.id} failed:`, err.message)
  })

  return worker
}
