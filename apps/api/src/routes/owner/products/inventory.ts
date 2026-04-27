import type { FastifyInstance } from 'fastify'
import { updateInventoryOptimistic } from '../../../services/inventory.service.js'

interface InventoryParams {
  productId: string
}

interface InventoryPatchBody {
  version:            number
  quantityAvailable?: number
  quantityReserved?:  number
  lowStockThreshold?: number
}

export async function inventoryRoutes(app: FastifyInstance) {
  // ── GET /:productId/inventory ──────────────────────────────────────────────
  app.get<{ Params: InventoryParams }>('/:productId/inventory', {
    schema: {
      tags:     ['owner-products'],
      summary:  'Obtener inventario de un producto',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const product = await app.prisma.product.findFirst({
      where: { id: req.params.productId, businessId },
    })
    if (!product) return reply.status(404).send({ error: 'not_found' })

    const inventory = await app.prisma.inventory.findUnique({
      where: { productId: req.params.productId },
    })
    if (!inventory) return reply.status(404).send({ error: 'not_found' })

    return reply.send(inventory)
  })

  // ── PATCH /:productId/inventory (optimistic locking) ──────────────────────
  app.patch<{ Params: InventoryParams; Body: InventoryPatchBody }>('/:productId/inventory', {
    schema: {
      tags:     ['owner-products'],
      summary:  'Actualizar inventario con optimistic locking (version)',
      security: [{ bearerAuth: [] }],
      body: {
        type:       'object',
        required:   ['version'],
        properties: {
          version:           { type: 'integer', minimum: 0 },
          quantityAvailable: { type: 'integer', minimum: 0 },
          quantityReserved:  { type: 'integer', minimum: 0 },
          lowStockThreshold: { type: 'integer', minimum: 0 },
        },
      },
      response: {
        409: {
          type:       'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    attachValidation: true,
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })
    if (req.validationError) return reply.status(422).send({ error: 'validation_error' })

    const product = await app.prisma.product.findFirst({
      where: { id: req.params.productId, businessId },
    })
    if (!product) return reply.status(404).send({ error: 'not_found' })

    const { version, ...updates } = req.body
    const { success } = await updateInventoryOptimistic(app.prisma, req.params.productId, version, updates)

    if (!success) return reply.status(409).send({ error: 'conflict' })

    const inventory = await app.prisma.inventory.findUnique({
      where: { productId: req.params.productId },
    })

    // Alerta de stock bajo
    if (
      inventory &&
      inventory.quantityAvailable <= inventory.lowStockThreshold
    ) {
      app.log.warn(
        {
          productId:         req.params.productId,
          quantityAvailable: inventory.quantityAvailable,
          lowStockThreshold: inventory.lowStockThreshold,
        },
        'low-stock alert',
      )
    }

    return reply.send(inventory)
  })
}
