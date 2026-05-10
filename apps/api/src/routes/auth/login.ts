import type { FastifyInstance } from 'fastify'
import { verifyPassword } from '../../services/auth.service.js'
import { issueRefreshToken } from '../../services/token.service.js'
import { setAuthCookies } from '../../utils/cookies.js'

interface LoginBody {
  email:    string
  password: string
}

export async function loginRoute(app: FastifyInstance) {
  app.post<{ Body: LoginBody }>('/login', {
    schema: {
      tags:    ['auth'],
      summary: 'Login del dueño — setea cookies httpOnly (cc_access, cc_refresh, cc_csrf)',
      body: {
        type:       'object',
        required:   ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id:         { type: 'string' },
                email:      { type: 'string' },
                role:       { type: 'string' },
                businessId: { type: 'string' },
              },
            },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string', enum: ['invalid_credentials'] } },
        },
        422: {
          type: 'object',
          properties: { error: { type: 'string', enum: ['validation_error'] } },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    if (req.validationError) {
      return reply.status(422).send({ error: 'validation_error' })
    }

    const email = req.body.email.toLowerCase()
    const { password } = req.body

    const user = await app.prisma.user.findFirst({
      where: { email },
    })

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return reply.status(401).send({ error: 'invalid_credentials' })
    }

    const accessToken = app.jwt.sign({
      sub:        user.id,
      businessId: user.businessId,
      role:       user.role,
    })

    const pair = await issueRefreshToken(app.prisma, {
      userId:    user.id,
      userAgent: req.headers['user-agent'] ?? undefined,
      ipAddress: req.ip,
    })

    setAuthCookies(reply, {
      accessToken,
      refreshToken: pair.refreshTokenRaw,
      csrfToken:    pair.csrfToken,
    })

    return reply.send({
      user: {
        id:         user.id,
        email:      user.email,
        role:       user.role,
        businessId: user.businessId,
      },
    })
  })
}
