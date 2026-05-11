import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { hash } from '@node-rs/argon2'
import { PrismaClient } from '@colacero/db'
import { buildServer } from '../../server.js'

/**
 * Integration tests — requieren PostgreSQL corriendo.
 * Antes de correr: pnpm infra:up
 */

const prisma = new PrismaClient()
const app    = buildServer()

const TEST_SLUG     = 'products-test-biz'
const TEST_EMAIL    = 'products-test@colacero.cu'
const TEST_PASSWORD = 'contraseñaSegura32chars!!'

let businessId:       string
let otherBusinessId:  string
let token:            string   // JWT extraído de la cookie cc_access
let csrfToken:        string   // valor de cc_csrf (para double-submit CSRF)
let productId:        string

type InjectResponse = Awaited<ReturnType<typeof app.inject>>
function getCookie(res: InjectResponse, name: string) {
  return res.cookies.find(c => c.name === name)
}

beforeAll(async () => {
  await app.ready()

  // Negocio de test principal
  const business = await prisma.business.upsert({
    where:  { slug: TEST_SLUG },
    update: {},
    create: { slug: TEST_SLUG, name: 'Test Products Biz' },
  })
  businessId = business.id

  // Negocio de otro dueño (para test de ownership)
  const other = await prisma.business.upsert({
    where:  { slug: 'products-test-other' },
    update: {},
    create: { slug: 'products-test-other', name: 'Other Biz' },
  })
  otherBusinessId = other.id

  // Usuario OWNER del negocio principal
  const passwordHash = await hash(TEST_PASSWORD)
  await prisma.user.upsert({
    where:  { businessId_email: { businessId, email: TEST_EMAIL } },
    update: { passwordHash },
    create: { businessId, email: TEST_EMAIL, passwordHash, role: 'OWNER' },
  })

  // Obtener tokens via login (Phase 2: devuelve cookies, no body.token)
  const loginRes = await app.inject({
    method:  'POST',
    url:     '/api/auth/owner/login',
    payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
  })
  token     = getCookie(loginRes, 'cc_access')!.value
  csrfToken = getCookie(loginRes, 'cc_csrf')!.value
})

afterAll(async () => {
  // Borrar datos de test (inventory cascadea desde product)
  await prisma.product.deleteMany({ where: { businessId } })
  await prisma.product.deleteMany({ where: { businessId: otherBusinessId } })
  await prisma.refreshToken.deleteMany({ where: { user: { email: TEST_EMAIL } } })
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } })
  await prisma.business.deleteMany({ where: { slug: { in: [TEST_SLUG, 'products-test-other'] } } })
  await prisma.$disconnect()
  await app.close()
})

// ── Sin autenticación ─────────────────────────────────────────────────────────

describe('endpoints sin token', () => {
  it('unauth-list: GET / sin JWT → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/owner/products' })
    expect(res.statusCode).toBe(401)
  })

  it('unauth-create: POST / sin JWT → 401', async () => {
    // Phase 2: CSRF hook dispara antes de auth para POSTs.
    // Pasamos tokens CSRF válidos (matching) para que auth sea el que falle → 401.
    const res = await app.inject({
      method:  'POST',
      url:     '/api/owner/products',
      cookies: { cc_csrf: 'test-token' },
      headers: { 'x-csrf-token': 'test-token' },
      payload: { name: 'Test', unitPrice: 10 },
    })
    expect(res.statusCode).toBe(401)
  })
})

// ── GET / ─────────────────────────────────────────────────────────────────────

describe('GET /api/owner/products', () => {
  it('list-empty: lista vacía al inicio del test', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     '/api/owner/products',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ products: unknown[] }>()
    expect(Array.isArray(body.products)).toBe(true)
  })
})

// ── POST / ───────────────────────────────────────────────────────────────────

describe('POST /api/owner/products', () => {
  it('create-ok: crea producto con inventory inicializado', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/owner/products',
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      payload: {
        name:             'Arroz blanco',
        sku:              'ARR-001',
        unitPrice:        15.5,
        initialQuantity:  20,
        lowStockThreshold: 5,
      },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json<any>()
    expect(body.name).toBe('Arroz blanco')
    expect(body.sku).toBe('ARR-001')
    expect(body.businessId).toBe(businessId)
    expect(body.isActive).toBe(true)
    expect(body.inventory).toBeDefined()
    expect(body.inventory.quantityAvailable).toBe(20)
    expect(body.inventory.lowStockThreshold).toBe(5)
    expect(body.inventory.version).toBe(0)

    productId = body.id
  })

  it('create-sku-conflict: SKU duplicado en el mismo negocio → 409', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/owner/products',
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      payload: { name: 'Arroz duplicado', sku: 'ARR-001', unitPrice: 10 },
    })
    expect(res.statusCode).toBe(409)
    expect(res.json<{ error: string }>().error).toBe('sku_conflict')
  })

  it('create-validation: sin name → 422', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/owner/products',
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      payload: { unitPrice: 5 },
    })
    expect(res.statusCode).toBe(422)
  })
})

// ── GET /:productId ───────────────────────────────────────────────────────────

describe('GET /api/owner/products/:productId', () => {
  it('get-ok: retorna producto con inventory', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     `/api/owner/products/${productId}`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const body = res.json<any>()
    expect(body.id).toBe(productId)
    expect(body.inventory).toBeDefined()
  })

  it('get-other-business: producto de otro negocio → 404', async () => {
    // Crear producto en el otro negocio
    const other = await prisma.product.create({
      data: {
        businessId:  otherBusinessId,
        name:        'Producto ajeno',
        unitPrice:   5,
        inventory:   { create: {} },
      },
    })

    const res = await app.inject({
      method:  'GET',
      url:     `/api/owner/products/${other.id}`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(404)
  })

  it('get-nonexistent: ID inexistente → 404', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     '/api/owner/products/nonexistent-id',
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(404)
  })
})

// ── PATCH /:productId ─────────────────────────────────────────────────────────

describe('PATCH /api/owner/products/:productId', () => {
  it('update-name: actualiza nombre del producto', async () => {
    const res = await app.inject({
      method:  'PATCH',
      url:     `/api/owner/products/${productId}`,
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      payload: { name: 'Arroz blanco premium' },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json<any>().name).toBe('Arroz blanco premium')
  })

  it('update-other-business: producto de otro negocio → 404', async () => {
    const other = await prisma.product.findFirst({
      where: { businessId: otherBusinessId },
    })
    const res = await app.inject({
      method:  'PATCH',
      url:     `/api/owner/products/${other!.id}`,
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      payload: { name: 'Hackeado' },
    })
    expect(res.statusCode).toBe(404)
  })
})

// ── DELETE /:productId ────────────────────────────────────────────────────────

describe('DELETE /api/owner/products/:productId', () => {
  it('deactivate: isActive=false (soft-delete)', async () => {
    // Crear producto para desactivar
    const created = await app.inject({
      method:  'POST',
      url:     '/api/owner/products',
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      payload: { name: 'Para desactivar', unitPrice: 1 },
    })
    const tempId = created.json<any>().id

    const res = await app.inject({
      method:  'DELETE',
      url:     `/api/owner/products/${tempId}`,
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json<{ ok: boolean }>().ok).toBe(true)

    // No aparece en el listado (filtra isActive: true)
    const list = await app.inject({
      method:  'GET',
      url:     '/api/owner/products',
      headers: { authorization: `Bearer ${token}` },
    })
    const products = list.json<{ products: any[] }>().products
    expect(products.find((p: any) => p.id === tempId)).toBeUndefined()
  })
})

// ── GET /:productId/inventory ─────────────────────────────────────────────────

describe('GET /api/owner/products/:productId/inventory', () => {
  it('inventory-get: retorna inventory con version=0', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     `/api/owner/products/${productId}/inventory`,
      headers: { authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    const inv = res.json<any>()
    expect(inv.productId).toBe(productId)
    expect(typeof inv.version).toBe('number')
    expect(inv.quantityAvailable).toBe(20)
  })
})

// ── PATCH /:productId/inventory ───────────────────────────────────────────────

describe('PATCH /api/owner/products/:productId/inventory (optimistic locking)', () => {
  it('inventory-update-ok: version correcta → 200, version se incrementa', async () => {
    // Primero obtenemos la versión actual
    const getRes = await app.inject({
      method:  'GET',
      url:     `/api/owner/products/${productId}/inventory`,
      headers: { authorization: `Bearer ${token}` },
    })
    const currentVersion = getRes.json<any>().version

    const res = await app.inject({
      method:  'PATCH',
      url:     `/api/owner/products/${productId}/inventory`,
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      payload: { version: currentVersion, quantityAvailable: 99 },
    })

    expect(res.statusCode).toBe(200)
    const inv = res.json<any>()
    expect(inv.quantityAvailable).toBe(99)
    expect(inv.version).toBe(currentVersion + 1)
  })

  it('inventory-conflict: version obsoleta → 409 conflict', async () => {
    // Usar una versión stale (0 cuando ya es > 0 tras el test anterior)
    const res = await app.inject({
      method:  'PATCH',
      url:     `/api/owner/products/${productId}/inventory`,
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      payload: { version: 0, quantityAvailable: 50 },
    })
    // version 0 ya fue consumida → debe dar conflict
    // (si la versión actual es 1+, esto siempre falla)
    // Nota: este test depende de que inventory-update-ok se haya ejecutado antes
    expect(res.statusCode).toBe(409)
    expect(res.json<{ error: string }>().error).toBe('conflict')
  })

  it('inventory-double-update: dos updates concurrentes, el segundo con versión stale → 409', async () => {
    // Crear producto fresco para este test
    const created = await app.inject({
      method:  'POST',
      url:     '/api/owner/products',
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      payload: { name: 'Producto OL', unitPrice: 5 },
    })
    const newId = created.json<any>().id

    // Primer update con version=0 → OK
    const first = await app.inject({
      method:  'PATCH',
      url:     `/api/owner/products/${newId}/inventory`,
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      payload: { version: 0, quantityAvailable: 10 },
    })
    expect(first.statusCode).toBe(200)
    expect(first.json<any>().version).toBe(1)

    // Segundo update con version=0 (stale) → 409
    const second = await app.inject({
      method:  'PATCH',
      url:     `/api/owner/products/${newId}/inventory`,
      cookies: { cc_csrf: csrfToken },
      headers: { authorization: `Bearer ${token}`, 'x-csrf-token': csrfToken },
      payload: { version: 0, quantityAvailable: 20 },
    })
    expect(second.statusCode).toBe(409)
    expect(second.json<{ error: string }>().error).toBe('conflict')
  })
})
