import type { FastifyInstance } from 'fastify'
// @ts-ignore
import { validateSlug } from "@colacero/shared";

export async function slugAvailableRoute(app: FastifyInstance) {
  app.get<{ Querystring: { slug?: string } }>('/slug-available', {
    schema: {
      tags:        ['auth'],
      summary:     'Verifica si un slug está disponible para registrar un negocio',
      querystring: {
        type:       'object',
        properties: { slug: { type: 'string' } },
      },
      response: {
        200: {
          type:       'object',
          properties: {
            available: { type: 'boolean' },
            reason:    { type: 'string'  },
          },
        },
      },
    },
  }, async (req, reply) => {
    const slug = (req.query.slug ?? '').toLowerCase()

    const validation = validateSlug(slug)
    if (!validation.valid) {
      return reply.send({ available: false, reason: validation.error })
    }

    const exists = await app.prisma.business.findUnique({ where: { slug } })
    if (exists) {
      return reply.send({ available: false, reason: 'taken' })
    }

    return reply.send({ available: true })
  })
}
