import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { PrismaClient } from '@colacero/db'
import { buildServer } from '../../server.js'

/**
 * Integration tests para GET /api/catalog/:slug (endpoint público).
 */

const prisma = new PrismaClient()
const app    = buildServer()

const TEST_SLUG = 'catalog-test-biz'

let businessId: string
let productId:  string

beforeAll(async () => {
  await app.ready()

  const business = await prisma.business.upsert({
    where:  { slug: TEST_SLUG },
    update: {},
    create: { slug: TEST_SLUG, name: 'Catálogo Test' },
  })
  businessId = business.id

  const product = await prisma.product.create({
    data: {
      businessId,
      name:      'Arroz integral',
      unitPrice: 12,
      isActive:  true,
      inventory: { create: { quantityAvailable: 30 } },
    },
  })
  productId = product.id

  // Producto inactivo — NO debe aparecer en el catálogo
  await prisma.product.create({
    data: {
      businessId,
      name:      'Producto desactivado',
      unitPrice: 5,
      isActive:  false,
      inventory: { create: {} },
    },
  })
})

afterAll(async () => {
  await prisma.product.deleteMany({ where: { businessId } })
  await prisma.business.deleteMany({ where: { slug: TEST_SLUG } })
  await prisma.$disconnect()
  await app.close()
})

describe('GET /api/catalog/:slug', () => {
  it('catalog-ok: retorna negocio y productos activos sin auth', async () => {
    const res = await app.inject({
      method: 'GET',
      url:    `/api/catalog/${TEST_SLUG}`,
    })

    expect(res.statusCode).toBe(200)
    const body = res.json<any>()
    expect(body.business.slug).toBe(TEST_SLUG)
    expect(body.business.name).toBe('Catálogo Test')
    expect(Array.isArray(body.products)).toBe(true)
    expect(body.products).toHaveLength(1)
    expect(body.products[0].id).toBe(productId)
    expect(body.products[0].name).toBe('Arroz integral')
    expect(body.products[0].inventory).toBeDefined()
    expect(body.products[0].inventory.quantityAvailable).toBe(30)
  })

  it('catalog-hides-inactive: productos inactivos no aparecen', async () => {
    const res = await app.inject({
      method: 'GET',
      url:    `/api/catalog/${TEST_SLUG}`,
    })
    const products = res.json<any>().products as any[]
    expect(products.every((p: any) => p.isActive)).toBe(true)
  })

  it('catalog-not-found: slug inexistente → 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url:    '/api/catalog/slug-que-no-existe',
    })
    expect(res.statusCode).toBe(404)
    expect(res.json<{ error: string }>().error).toBe('not_found')
  })

  it('catalog-no-auth-required: no necesita Authorization header', async () => {
    // Confirmación explícita: sin ningún header de auth funciona
    const res = await app.inject({
      method:  'GET',
      url:     `/api/catalog/${TEST_SLUG}`,
      headers: {},
    })
    expect(res.statusCode).toBe(200)
  })
})
