import type { FastifyInstance } from 'fastify'
import { reserveStock, releaseReservation } from '../../services/reservation.service.js'

interface ReserveBody {
  productId: string
  quantity:  number
}

interface ReleaseParams {
  reservationId: string
}

export async function cartReserveRoutes(app: FastifyInstance) {
  /**
   * POST /api/cart/reserve
   * Reserva stock para un producto (cliente anónimo).
   * Devuelve reservationId que identifica la reserva.
   */
  app.post<{ Body: ReserveBody }>('/', {
    schema: {
      tags:    ['cart'],
      summary: 'Reserva temporal de stock (TTL 10 min)',
      body: {
        type:     'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string' },
          quantity:  { type: 'integer', minimum: 1 },
        },
      },
      response: {
        201: {
          type:       'object',
          properties: {
            reservationId: { type: 'string' },
            expiresAt:     { type: 'string' },
          },
        },
        404: { type: 'object', properties: { error: { type: 'string' } } },
        409: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (req, reply) => {
    const { productId, quantity } = req.body

    const result = await reserveStock(app.prisma, app.redis, productId, quantity)

    if (!result.ok) {
      const status = result.reason === 'product_not_found' ? 404 : 409
      return reply.status(status).send({ error: result.reason })
    }

    return reply.status(201).send({
      reservationId: result.reservationId,
      expiresAt:     result.expiresAt,
    })
  })

  /**
   * DELETE /api/cart/reserve/:reservationId
   * Libera una reserva manualmente antes del TTL.
   */
  app.delete<{ Params: ReleaseParams }>('/:reservationId', {
    schema: {
      tags:    ['cart'],
      summary: 'Libera una reserva de stock',
      params: {
        type:       'object',
        required:   ['reservationId'],
        properties: {
          reservationId: { type: 'string' },
        },
      },
      response: {
        204: { type: 'null' },
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (req, reply) => {
    const { reservationId } = req.params

    const result = await releaseReservation(app.prisma, app.redis, reservationId)

    if (!result.ok) {
      return reply.status(404).send({ error: result.reason })
    }

    return reply.status(204).send()
  })
}
