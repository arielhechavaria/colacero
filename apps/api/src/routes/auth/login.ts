import type { FastifyInstance } from 'fastify'
import { verifyPassword } from '../../services/auth.service.js'

interface LoginBody {
  email:    string
  password: string
}

export async function loginRoute(app: FastifyInstance) {
  app.post<{ Body: LoginBody }>('/login', {
    schema: {
      body: {
        type:       'object',
        required:   ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
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

    const token = app.jwt.sign({
      sub:        user.id,
      businessId: user.businessId,
      role:       user.role,
    })

    return reply.send({
      token,
      user: {
        id:         user.id,
        email:      user.email,
        role:       user.role,
        businessId: user.businessId,
      },
    })
  })
}
