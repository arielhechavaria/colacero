import type { FastifyInstance } from 'fastify'
import { pickupWindowsRoute } from './pickup-windows.js'

interface CatalogParams        { slug: string }
interface OrderByCodeParams    { slug: string; code: string }

export async function catalogRoutes(app: FastifyInstance) {
  app.register(pickupWindowsRoute)

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
        id:          business.id,
        name:        business.name,
        slug:        business.slug,
        description: business.description ?? null,
      },
      products,
    })
  })

  // ── GET /api/catalog/:slug/order/:code ────────────────────────────────────
  // Consulta pública del estado de un pedido por código de recogida.
  // Sin auth — accesible desde cualquier link de seguimiento.
  app.get<{ Params: OrderByCodeParams }>('/:slug/order/:code', {
    schema: {
      tags:    ['catalog'],
      summary: 'Estado público de un pedido por código de recogida',
      params: {
        type:       'object',
        required:   ['slug', 'code'],
        properties: {
          slug: { type: 'string' },
          code: { type: 'string' },
        },
      },
      response: {
        404: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (req, reply) => {
    const { slug, code } = req.params

    const order = await app.prisma.order.findFirst({
      where: {
        pickupCode: code.toUpperCase(),
        business:   { slug },
      },
      select: {
        id:          true,
        pickupCode:  true,
        status:      true,
        subtotal:    true,
        confirmedAt: true,
        notes:       true,
        business:    { select: { id: true, name: true, slug: true } },
        pickupWindow: {
          select: { id: true, date: true, startTime: true, endTime: true },
        },
        items: {
          select: {
            id:       true,
            quantity: true,
            subtotal: true,
            product:  { select: { name: true, unitLabel: true } },
          },
        },
      },
    })

    if (!order) return reply.status(404).send({ error: 'order_not_found' })

    return reply.send({
      id:          order.id,
      pickupCode:  order.pickupCode,
      status:      order.status,
      subtotal:    Number(order.subtotal),
      confirmedAt: order.confirmedAt?.toISOString() ?? null,
      notes:       order.notes,
      business:    order.business,
      pickupWindow: order.pickupWindow
        ? {
            ...order.pickupWindow,
            date: order.pickupWindow.date.toISOString().slice(0, 10),
          }
        : null,
      items: order.items.map((item) => ({
        id:        item.id,
        name:      item.product.name,
        unitLabel: item.product.unitLabel,
        quantity:  item.quantity,
        subtotal:  Number(item.subtotal),
      })),
    })
  })
}
