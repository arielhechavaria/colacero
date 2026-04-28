import type { FastifyInstance } from 'fastify'

interface CatalogParams {
  slug: string
}

export async function catalogRoutes(app: FastifyInstance) {
  /**
   * GET /api/catalog/:slug
   * Endpoint público (sin auth) — devuelve productos activos de un negocio
   * por su slug. Usado por el frontend Next.js del catálogo.
   */
  app.get<{ Params: CatalogParams }>('/:slug', {
    schema: {
      tags:    ['catalog'],
      summary: 'Catálogo público de productos por slug del negocio',
      params: {
        type:       'object',
        required:   ['slug'],
        properties: {
          slug: { type: 'string' },
        },
      },
      response: {
        404: {
          type:       'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
  }, async (req, reply) => {
    const { slug } = req.params

    const business = await app.prisma.business.findUnique({
      where: { slug },
    })
    if (!business) return reply.status(404).send({ error: 'not_found' })

    const products = await app.prisma.product.findMany({
      where: {
        businessId: business.id,
        isActive:   true,
      },
      include: {
        inventory: {
          select: {
            quantityAvailable: true,
            lowStockThreshold: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return reply.send({
      business: {
        id:   business.id,
        name: business.name,
        slug: business.slug,
      },
      products,
    })
  })
}
