import type { FastifyInstance } from 'fastify'
import { ANNOUNCEMENT_QUEUE } from '../../../workers/announcement.worker.js'

interface AnnouncementBody {
  text: string
}

export async function ownerAnnouncementRoutes(app: FastifyInstance) {

  // POST / — publicar anuncio en el canal de Telegram
  app.post<{ Body: AnnouncementBody }>('/', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-announcements'],
      summary:  'Publicar anuncio en el canal de Telegram',
      security: [{ bearerAuth: [] }],
      body: {
        type:       'object',
        required:   ['text'],
        properties: {
          text: { type: 'string', minLength: 1, maxLength: 4096 },
        },
      },
      response: {
        202: {
          type:       'object',
          properties: {
            jobId: { type: 'string' },
            queue: { type: 'string' },
          },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })
    if (req.validationError) return reply.status(422).send({ error: 'validation_error' })

    const { text } = req.body

    const job = await app.queue.add(
      'publish',
      { businessId, text },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    )

    return reply.status(202).send({ jobId: job.id, queue: ANNOUNCEMENT_QUEUE })
  })
}
