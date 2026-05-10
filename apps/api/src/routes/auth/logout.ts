import type { FastifyInstance } from 'fastify'
import { revokeRefreshToken, REFRESH_COOKIE } from '../../services/token.service.js'
import { clearAuthCookies } from '../../utils/cookies.js'

export async function logoutRoute(app: FastifyInstance) {
  app.post('/logout', {
    schema: {
      tags:    ['auth'],
      summary: 'Logout — revoca el refresh token actual',
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' } } },
      },
    },
  }, async (req, reply) => {
    const raw = req.cookies[REFRESH_COOKIE]
    if (raw) {
      await revokeRefreshToken(app.prisma, raw)
    }
    clearAuthCookies(reply)
    return reply.send({ ok: true })
  })
}
