import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { hash } from '@node-rs/argon2'
import { PrismaClient } from '@colacero/db'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { env } from '@colacero/env'
import { buildServer } from '../../server.js'

/**
 * Integration tests para POST /api/owner/products/:id/image
 */

const prisma = new PrismaClient()
const app    = buildServer()

const TEST_SLUG     = 'upload-test-biz'
const TEST_EMAIL    = 'upload-test@colacero.cu'
const TEST_PASSWORD = 'contraseñaSegura32chars!!'

let businessId: string
let productId:  string
let token:      string
let csrfToken:  string

type InjectResponse = Awaited<ReturnType<typeof app.inject>>
function getCookie(res: InjectResponse, name: string) {
  return res.cookies.find(c => c.name === name)
}

// Multipart body helper
function makeMultipart(
  fieldName: string,
  filename:  string,
  mimeType:  string,
  content:   Buffer,
): { boundary: string; body: Buffer } {
  const boundary = '----TestBoundary' + Date.now()
  const header   = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
    `Content-Type: ${mimeType}\r\n\r\n`,
  )
  const footer = Buffer.from(`\r\n--${boundary}--\r\n`)
  return { boundary, body: Buffer.concat([header, content, footer]) }
}

// JPEG mínimo válido (magic bytes)
const FAKE_JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])

beforeAll(async () => {
  await app.ready()

  const business = await prisma.business.upsert({
    where:  { slug: TEST_SLUG },
    update: {},
    create: { slug: TEST_SLUG, name: 'Upload Test Biz' },
  })
  businessId = business.id

  const passwordHash = await hash(TEST_PASSWORD)
  await prisma.user.upsert({
    where:  { email: TEST_EMAIL },
    update: { passwordHash },
    create: { businessId, email: TEST_EMAIL, passwordHash, role: 'OWNER' },
  })

  const loginRes = await app.inject({
    method:  'POST',
    url:     '/api/auth/owner/login',
    payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
  })
  token     = getCookie(loginRes, 'cc_access')!.value
  csrfToken = getCookie(loginRes, 'cc_csrf')!.value

  const product = await prisma.product.create({
    data: {
      businessId,
      name:      'Producto con imagen',
      unitPrice: 10,
      inventory: { create: {} },
    },
  })
  productId = product.id
})

afterAll(async () => {
  // Limpiar archivos subidos en el test
  try {
    await rm(resolve(env.UPLOAD_DIR, 'products', productId), { recursive: true, force: true })
  } catch { /* ignorar si no existe */ }

  await prisma.refreshToken.deleteMany({ where: { user: { email: TEST_EMAIL } } })
  await prisma.product.deleteMany({ where: { businessId } })
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } })
  await prisma.business.deleteMany({ where: { slug: TEST_SLUG } })
  await prisma.$disconnect()
  await app.close()
})

describe('POST /api/owner/products/:id/image', () => {
  it('upload-ok: sube JPEG y actualiza imageUrl en DB', async () => {
    const { boundary, body } = makeMultipart('image', 'foto.jpg', 'image/jpeg', FAKE_JPEG)

    const res = await app.inject({
      method:  'POST',
      url:     `/api/owner/products/${productId}/image`,
      cookies: { cc_csrf: csrfToken },
      headers: {
        authorization:   `Bearer ${token}`,
        'content-type':  `multipart/form-data; boundary=${boundary}`,
        'x-csrf-token':  csrfToken,
      },
      body,
    })

    expect(res.statusCode).toBe(200)
    const { imageUrl } = res.json<{ imageUrl: string }>()
    expect(imageUrl).toMatch(/\/uploads\/products\//)
    expect(imageUrl).toMatch(/\.jpg$/)

    // Verificar que el producto tiene imageUrl actualizado en DB
    const product = await prisma.product.findUnique({ where: { id: productId } })
    expect(product?.imageUrl).toBe(imageUrl)
  })

  it('upload-invalid-mime: PDF no permitido → 422', async () => {
    const { boundary, body } = makeMultipart('image', 'doc.pdf', 'application/pdf', Buffer.from('%PDF'))

    const res = await app.inject({
      method:  'POST',
      url:     `/api/owner/products/${productId}/image`,
      cookies: { cc_csrf: csrfToken },
      headers: {
        authorization:   `Bearer ${token}`,
        'content-type':  `multipart/form-data; boundary=${boundary}`,
        'x-csrf-token':  csrfToken,
      },
      body,
    })

    expect(res.statusCode).toBe(422)
    expect(res.json<{ error: string }>().error).toBe('invalid_mime_type')
  })

  it('upload-no-file: sin archivo → 422', async () => {
    const boundary = '----TestBoundaryEmpty'
    const emptyBody = Buffer.from(`--${boundary}--\r\n`)

    const res = await app.inject({
      method:  'POST',
      url:     `/api/owner/products/${productId}/image`,
      cookies: { cc_csrf: csrfToken },
      headers: {
        authorization:   `Bearer ${token}`,
        'content-type':  `multipart/form-data; boundary=${boundary}`,
        'x-csrf-token':  csrfToken,
      },
      body: emptyBody,
    })

    expect(res.statusCode).toBe(422)
  })

  it('upload-unauth: sin JWT → 401', async () => {
    const { boundary, body } = makeMultipart('image', 'foto.jpg', 'image/jpeg', FAKE_JPEG)

    // CSRF válido pero sin Bearer — CSRF pasa, auth falla → 401
    const res = await app.inject({
      method:  'POST',
      url:     `/api/owner/products/${productId}/image`,
      cookies: { cc_csrf: csrfToken },
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`,
        'x-csrf-token': csrfToken,
      },
      body,
    })

    expect(res.statusCode).toBe(401)
  })

  it('upload-other-product: producto de otro negocio → 404', async () => {
    const other = await prisma.business.upsert({
      where:  { slug: 'upload-other-biz' },
      update: {},
      create: { slug: 'upload-other-biz', name: 'Other' },
    })
    const otherProduct = await prisma.product.create({
      data: { businessId: other.id, name: 'Ajeno', unitPrice: 1, inventory: { create: {} } },
    })

    const { boundary, body } = makeMultipart('image', 'foto.jpg', 'image/jpeg', FAKE_JPEG)
    const res = await app.inject({
      method:  'POST',
      url:     `/api/owner/products/${otherProduct.id}/image`,
      cookies: { cc_csrf: csrfToken },
      headers: {
        authorization:   `Bearer ${token}`,
        'content-type':  `multipart/form-data; boundary=${boundary}`,
        'x-csrf-token':  csrfToken,
      },
      body,
    })

    expect(res.statusCode).toBe(404)

    // cleanup
    await prisma.product.deleteMany({ where: { businessId: other.id } })
    await prisma.business.delete({ where: { id: other.id } })
  })
})
