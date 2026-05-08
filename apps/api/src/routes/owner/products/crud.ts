import type { FastifyInstance } from 'fastify'

interface ProductBody {
  name:               string
  sku?:               string
  description?:       string
  unitPrice:          number
  unitLabel?:         string
  imageUrl?:          string
  category?:          string
  initialQuantity?:   number
  lowStockThreshold?: number
}

interface ProductPatchBody {
  name?:        string
  sku?:         string
  description?: string
  unitPrice?:   number
  unitLabel?:   string
  imageUrl?:    string
  category?:    string | null
  isActive?:    boolean
}

interface ProductParams {
  productId: string
}

export async function crudRoutes(app: FastifyInstance) {
  // ── GET / ──────────────────────────────────────────────────────────────────
  app.get('/', {
    schema: {
      tags:     ['owner-products'],
      summary:  'Listar productos activos del negocio',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const products = await app.prisma.product.findMany({
      where:   { businessId, isActive: true },
      include: { inventory: true },
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ products })
  })

  // ── POST / ─────────────────────────────────────────────────────────────────
  app.post<{ Body: ProductBody }>('/', {
    schema: {
      tags:     ['owner-products'],
      summary:  'Crear producto e inicializar inventario',
      security: [{ bearerAuth: [] }],
      body: {
        type:       'object',
        required:   ['name', 'unitPrice'],
        properties: {
          name:               { type: 'string', minLength: 1 },
          sku:                { type: 'string' },
          description:        { type: 'string' },
          unitPrice:          { type: 'number', minimum: 0 },
          unitLabel:          { type: 'string' },
          imageUrl:           { type: 'string' },
          category:           { type: 'string' },
          initialQuantity:    { type: 'integer', minimum: 0 },
          lowStockThreshold:  { type: 'integer', minimum: 0 },
        },
      },
    },
    attachValidation: true,
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })
    if (req.validationError) return reply.status(422).send({ error: 'validation_error' })

    const {
      name, sku, description,
      unitPrice, unitLabel, imageUrl, category,
      initialQuantity   = 0,
      lowStockThreshold = 5,
    } = req.body

    try {
      const product = await app.prisma.product.create({
        data: {
          businessId,
          name,
          // String? fields: undefined → null (exactOptionalPropertyTypes)
          sku:         sku         ?? null,
          description: description ?? null,
          unitPrice,
          // String @default: omit if undefined so Prisma applies the default
          ...(unitLabel !== undefined ? { unitLabel } : {}),
          imageUrl:    imageUrl    ?? null,
          category:    category    ?? null,
          inventory: {
            create: { quantityAvailable: initialQuantity, lowStockThreshold },
          },
        },
        include: { inventory: true },
      })
      return reply.status(201).send(product)
    } catch (err: any) {
      if (err?.code === 'P2002') {
        return reply.status(409).send({ error: 'sku_conflict' })
      }
      throw err
    }
  })

  // ── GET /:productId ────────────────────────────────────────────────────────
  app.get<{ Params: ProductParams }>('/:productId', {
    schema: {
      tags:     ['owner-products'],
      summary:  'Obtener producto por ID',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const product = await app.prisma.product.findFirst({
      where:   { id: req.params.productId, businessId },
      include: { inventory: true },
    })
    if (!product) return reply.status(404).send({ error: 'not_found' })
    return reply.send(product)
  })

  // ── PATCH /:productId ──────────────────────────────────────────────────────
  app.patch<{ Params: ProductParams; Body: ProductPatchBody }>('/:productId', {
    schema: {
      tags:     ['owner-products'],
      summary:  'Actualizar producto',
      security: [{ bearerAuth: [] }],
      body: {
        type:       'object',
        properties: {
          name:        { type: 'string', minLength: 1 },
          sku:         { type: 'string' },
          description: { type: 'string' },
          unitPrice:   { type: 'number', minimum: 0 },
          unitLabel:   { type: 'string' },
          imageUrl:    { type: 'string' },
          category:    { type: ['string', 'null'] },
          isActive:    { type: 'boolean' },
        },
      },
    },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const existing = await app.prisma.product.findFirst({
      where: { id: req.params.productId, businessId },
    })
    if (!existing) return reply.status(404).send({ error: 'not_found' })

    const product = await app.prisma.product.update({
      where:   { id: req.params.productId },
      data:    req.body,
      include: { inventory: true },
    })
    return reply.send(product)
  })

  // ── DELETE /:productId (soft-delete) ───────────────────────────────────────
  app.delete<{ Params: ProductParams }>('/:productId', {
    schema: {
      tags:     ['owner-products'],
      summary:  'Desactivar producto (soft-delete)',
      security: [{ bearerAuth: [] }],
    },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const existing = await app.prisma.product.findFirst({
      where: { id: req.params.productId, businessId },
    })
    if (!existing) return reply.status(404).send({ error: 'not_found' })

    await app.prisma.product.update({
      where: { id: req.params.productId },
      data:  { isActive: false },
    })
    return reply.send({ ok: true })
  })
}
