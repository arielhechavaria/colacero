import type { FastifyInstance } from 'fastify'
import '@fastify/multipart'   // type augmentation → req.file()
import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { randomBytes } from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import { env } from '@colacero/env'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

interface ImageParams {
  productId: string
}

export async function uploadImageRoute(app: FastifyInstance) {
  app.post<{ Params: ImageParams }>('/:productId/image', {
    schema: {
      tags:     ['owner-products'],
      summary:  'Subir imagen de un producto',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
    },
    preHandler: [app.authenticate],
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    // Verificar ownership del producto
    const product = await app.prisma.product.findFirst({
      where: { id: req.params.productId, businessId },
    })
    if (!product) return reply.status(404).send({ error: 'not_found' })

    // Leer el archivo del multipart
    const file = await req.file()
    if (!file) return reply.status(422).send({ error: 'missing_file' })

    if (!ALLOWED_MIME.has(file.mimetype)) {
      return reply.status(422).send({ error: 'invalid_mime_type' })
    }

    // Construir path de destino
    const ext       = extname(file.filename) || `.${file.mimetype.split('/')[1]}`
    const filename  = `${Date.now()}-${randomBytes(4).toString('hex')}${ext}`
    const dir       = resolve(env.UPLOAD_DIR, 'products', req.params.productId)
    const filepath  = resolve(dir, filename)

    await mkdir(dir, { recursive: true })
    await pipeline(file.file, createWriteStream(filepath))

    // Guardar URL pública en el producto
    const relativePath = `/uploads/products/${req.params.productId}/${filename}`
    const imageUrl     = `${env.API_PUBLIC_URL}${relativePath}`

    await app.prisma.product.update({
      where: { id: req.params.productId },
      data:  { imageUrl },
    })

    return reply.send({ imageUrl })
  })
}
