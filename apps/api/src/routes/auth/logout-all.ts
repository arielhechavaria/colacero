import type { FastifyInstance } from 'fastify'
import { revokeAllForUser, revokeAllForCustomer } from '../../services/token.service.js'
import { clearAuthCookies } from '../../utils/cookies.js'

export async function logoutAllRoute(app: FastifyInstance) {
  app.post('/logout-all', {
    onRequest: [app.authenticate],
    schema: {
      tags:    ['auth'],
      summary: 'Logout en TODOS los dispositivos del usuario actual',
      response: {
        200: {
          type: 'object',
          properties: {
            ok:      { type: 'boolean' },
            revoked: { type: 'integer' },
          },
        },
      },
    },
  }, async (req, reply) => {
    let count = 0
    if (req.user.businessId) {
      // Owner — sub is User.id
      count = await revokeAllForUser(app.prisma, req.user.sub)
    } else {
      // Customer — sub is Customer.id
      count = await revokeAllForCustomer(app.prisma, req.user.sub)
    }
    clearAuthCookies(reply)
    return reply.send({ ok: true, revoked: count })
  })
}
