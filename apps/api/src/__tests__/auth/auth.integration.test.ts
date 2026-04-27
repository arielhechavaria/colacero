import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { hash } from '@node-rs/argon2'
import { PrismaClient } from '@colacero/db'
import { buildServer } from '../../server.js'

/**
 * Integration tests — requieren PostgreSQL corriendo.
 * Antes de correr: pnpm infra:up
 * Vars necesarias: DATABASE_URL, REDIS_URL, JWT_SECRET
 */

const prisma = new PrismaClient()
const app    = buildServer()

const TEST_EMAIL    = 'test-auth@elfogon.cu'
const TEST_PASSWORD = 'contraseñaSegura32chars!!'
const TEST_SLUG     = 'el-fogon'

let testBusinessId: string
let testUserId: string
let validToken: string

beforeAll(async () => {
  await app.ready()

  // Reutilizar el negocio del seed o crearlo si no existe
  const business = await prisma.business.upsert({
    where:  { slug: TEST_SLUG },
    update: {},
    create: {
      slug:  TEST_SLUG,
      name:  'El Fogón (test)',
    },
  })
  testBusinessId = business.id

  // Crear usuario de test con hash argon2id
  const passwordHash = await hash(TEST_PASSWORD)
  const user = await prisma.user.upsert({
    where:  { businessId_email: { businessId: testBusinessId, email: TEST_EMAIL } },
    update: { passwordHash },
    create: {
      businessId:   testBusinessId,
      email:        TEST_EMAIL,
      passwordHash,
      role:         'OWNER',
    },
  })
  testUserId = user.id
})

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } })
  await prisma.$disconnect()
  await app.close()
})

// ── POST /api/auth/owner/login ────────────────────────────────────────────────

describe('POST /api/auth/owner/login', () => {
  it('login-ok: credenciales correctas → 200 con token y datos del usuario', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json<{ token: string; user: { id: string; email: string; role: string; businessId: string } }>()
    expect(body.token).toBeDefined()
    expect(body.user.email).toBe(TEST_EMAIL)
    expect(body.user.role).toBe('OWNER')
    expect(body.user.businessId).toBe(testBusinessId)
    expect(body.user.id).toBe(testUserId)

    validToken = body.token
  })

  it('login-wrong-pass: contraseña incorrecta → 401 invalid_credentials', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: TEST_EMAIL, password: 'contraseñaEquivocada' },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json<{ error: string }>().error).toBe('invalid_credentials')
  })

  it('login-unknown-email: email no registrado → 401 invalid_credentials', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: 'noexiste@elfogon.cu', password: TEST_PASSWORD },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json<{ error: string }>().error).toBe('invalid_credentials')
  })

  it('login-email-uppercase: email con mayúsculas se normaliza a lowercase', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: TEST_EMAIL.toUpperCase(), password: TEST_PASSWORD },
    })

    expect(res.statusCode).toBe(200)
  })

  it('login-empty-pass: password vacío → 422 validation_error', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: TEST_EMAIL, password: '' },
    })

    expect(res.statusCode).toBe(422)
    expect(res.json<{ error: string }>().error).toBe('validation_error')
  })

  it('login-short-pass: password < 8 chars → 422 validation_error', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: TEST_EMAIL, password: 'corto' },
    })

    expect(res.statusCode).toBe(422)
    expect(res.json<{ error: string }>().error).toBe('validation_error')
  })
})

// ── GET /api/auth/owner/me ────────────────────────────────────────────────────

describe('GET /api/auth/owner/me', () => {
  it('me-with-token: token válido → 200 con perfil del usuario', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     '/api/auth/owner/me',
      headers: { authorization: `Bearer ${validToken}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json<{ id: string; email: string; role: string; businessId: string; businessSlug: string }>()
    expect(body.id).toBe(testUserId)
    expect(body.email).toBe(TEST_EMAIL)
    expect(body.businessSlug).toBe(TEST_SLUG)
  })

  it('me-no-token: sin Authorization header → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/owner/me' })
    expect(res.statusCode).toBe(401)
  })

  it('me-expired-token: token expirado → 401', async () => {
    // JWT expirado manualmente construido (exp en el pasado)
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiYnVzaW5lc3NJZCI6InRlc3QiLCJyb2xlIjoiT1dORVIiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMDAwMX0.invalid'
    const res = await app.inject({
      method:  'GET',
      url:     '/api/auth/owner/me',
      headers: { authorization: `Bearer ${expiredToken}` },
    })
    expect(res.statusCode).toBe(401)
  })

  it('me-tampered-token: firma inválida → 401', async () => {
    const tampered = (validToken ?? 'dummy.dummy.dummy') + 'TAMPERED'
    const res = await app.inject({
      method:  'GET',
      url:     '/api/auth/owner/me',
      headers: { authorization: `Bearer ${tampered}` },
    })
    expect(res.statusCode).toBe(401)
  })
})
