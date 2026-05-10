import type { FastifyInstance } from 'fastify'
import { rotateRefreshToken, REFRESH_COOKIE, TokenError } from '../../services/token.service.js'
import { setAuthCookies, clearAuthCookies } from '../../utils/cookies.js'

export async function refreshRoute(app: FastifyInstance) {
  app.post('/refresh', {
    schema: {
      tags:    ['auth'],
      summary: 'Rotar access + refresh tokens',
      response: {
        200: { type: 'object', properties: { ok: { type: 'boolean' } } },
        401: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (req, reply) => {
    const raw = req.cookies[REFRESH_COOKIE]
    if (!raw) {
      clearAuthCookies(reply)
      return reply.code(401).send({ error: 'no_refresh_cookie' })
    }

    try {
      const result = await rotateRefreshToken(app.prisma, {
        rawRefresh: raw,
        userAgent:  req.headers['user-agent'] ?? undefined,
        ipAddress:  req.ip,
      })

      let accessToken: string
      if (result.user) {
        accessToken = app.jwt.sign({
          sub:        result.user.id,
          businessId: result.user.businessId,
          role:       result.user.role,
        })
      } else if (result.customer) {
        accessToken = app.jwt.sign({
          sub:        result.customer.id,
          ...(result.customer.telegramId ? { telegramId: result.customer.telegramId } : {}),
          ...(result.customer.phone      ? { phone:      result.customer.phone      } : {}),
        })
      } else {
        // Should be unreachable — rotateRefreshToken guarantees one of user/customer is present
        clearAuthCookies(reply)
        return reply.code(401).send({ error: 'refresh_orphan' })
      }
      setAuthCookies(reply, {
        accessToken,
        refreshToken: result.pair.refreshTokenRaw,
        csrfToken:    result.pair.csrfToken,
      })

      return reply.send({ ok: true })
    } catch (e) {
      clearAuthCookies(reply)
      if (e instanceof TokenError) {
        return reply.code(401).send({ error: e.code })
      }
      throw e
    }
  })
}
