import type { FastifyInstance } from 'fastify'

export async function meRoute(app: FastifyInstance) {
  app.get('/me', {
    preHandler: [app.authenticate],
    schema: {
      tags:     ['auth'],
      summary:  'Perfil del dueño autenticado',
      security: [{ bearerAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            id:           { type: 'string' },
            email:        { type: 'string' },
            role:         { type: 'string' },
            businessId:   { type: 'string' },
            businessSlug: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (req, reply) => {
    const userId = req.user.sub

    const user = await app.prisma.user.findUnique({
      where:   { id: userId },
      include: { business: { select: { slug: true } } },
    })

    if (!user) {
      return reply.notFound()
    }

    return reply.send({
      id:           user.id,
      email:        user.email,
      role:         user.role,
      businessId:   user.businessId,
      businessSlug: user.business.slug,
    })
  })
}
