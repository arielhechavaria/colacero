import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { hash } from '@node-rs/argon2'
import { PrismaClient } from '@colacero/db'
import { buildServer } from '../../server.js'

/**
 * Integration tests — requieren PostgreSQL corriendo.
 * Antes de correr: pnpm infra:up
 * Vars necesarias: DATABASE_URL, REDIS_URL, JWT_SECRET, COOKIE_SECRET
 */

const prisma = new PrismaClient()
const app    = buildServer()

const TEST_EMAIL    = 'test-auth@elfogon.cu'
const TEST_PASSWORD = 'contraseñaSegura32chars!!'
const TEST_SLUG     = 'el-fogon'

let testBusinessId: string
let testUserId:     string

type InjectResponse = Awaited<ReturnType<typeof app.inject>>

/** Busca una cookie por nombre en el Set-Cookie de la respuesta inject. */
function getCookie(res: InjectResponse, name: string) {
  return res.cookies.find(c => c.name === name)
}

beforeAll(async () => {
  await app.ready()

  const business = await prisma.business.upsert({
    where:  { slug: TEST_SLUG },
    update: {},
    create: { slug: TEST_SLUG, name: 'El Fogón (test)' },
  })
  testBusinessId = business.id

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
  await prisma.refreshToken.deleteMany({ where: { user: { email: TEST_EMAIL } } })
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } })
  await prisma.$disconnect()
  await app.close()
})

// ── POST /api/auth/owner/login ────────────────────────────────────────────────

describe('POST /api/auth/owner/login', () => {
  it('login-ok: credenciales correctas → 200, { user }, 3 cookies; token NO en body', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json<{ user: { id: string; email: string; role: string; businessId: string } }>()

    // El token NO debe viajar en el body (ya no se usa sessionStorage)
    expect((body as Record<string, unknown>).token).toBeUndefined()
    expect(body.user.email).toBe(TEST_EMAIL)
    expect(body.user.role).toBe('OWNER')
    expect(body.user.businessId).toBe(testBusinessId)
    expect(body.user.id).toBe(testUserId)

    // Las 3 cookies deben estar presentes
    const access  = getCookie(res, 'cc_access')
    const refresh = getCookie(res, 'cc_refresh')
    const csrf    = getCookie(res, 'cc_csrf')

    expect(access).toBeDefined()
    expect(refresh).toBeDefined()
    expect(csrf).toBeDefined()

    // cc_access y cc_refresh son httpOnly; cc_csrf NO (el frontend la lee con document.cookie)
    expect(access?.httpOnly).toBe(true)
    expect(refresh?.httpOnly).toBe(true)
    expect(csrf?.httpOnly).toBe(false)
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
  let accessToken: string

  beforeAll(async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })
    accessToken = getCookie(res, 'cc_access')!.value
  })

  it('me-with-cookie: cc_access cookie válida → 200 con perfil del usuario', async () => {
    const res = await app.inject({
      method:  'GET',
      url:     '/api/auth/owner/me',
      cookies: { cc_access: accessToken },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json<{ id: string; email: string; role: string; businessId: string; businessSlug: string }>()
    expect(body.id).toBe(testUserId)
    expect(body.email).toBe(TEST_EMAIL)
    expect(body.businessSlug).toBe(TEST_SLUG)
  })

  it('me-no-cookie: sin cookie cc_access → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/auth/owner/me' })
    expect(res.statusCode).toBe(401)
  })

  it('me-expired-cookie: JWT expirado en cookie → 401', async () => {
    // JWT con exp en el pasado (firma inválida — Fastify rechaza antes de verificar exp)
    const expiredJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiYnVzaW5lc3NJZCI6InRlc3QiLCJyb2xlIjoiT1dORVIiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMDAwMX0.invalid'
    const res = await app.inject({
      method:  'GET',
      url:     '/api/auth/owner/me',
      cookies: { cc_access: expiredJwt },
    })

    expect(res.statusCode).toBe(401)
  })

  it('me-tampered-cookie: firma inválida → 401', async () => {
    const tampered = accessToken + 'TAMPERED'
    const res = await app.inject({
      method:  'GET',
      url:     '/api/auth/owner/me',
      cookies: { cc_access: tampered },
    })
    expect(res.statusCode).toBe(401)
  })
})

// ── POST /api/auth/refresh ────────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  let initialRefreshToken: string
  let rotatedRefreshToken: string

  beforeAll(async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })
    initialRefreshToken = getCookie(res, 'cc_refresh')!.value
  })

  it('refresh-ok: cc_refresh válido → 200 { ok: true } y 3 nuevas cookies; token rotado', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/refresh',
      cookies: { cc_refresh: initialRefreshToken },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json<{ ok: boolean }>().ok).toBe(true)

    // Las 3 cookies nuevas deben estar presentes
    expect(getCookie(res, 'cc_access')).toBeDefined()
    expect(getCookie(res, 'cc_csrf')).toBeDefined()

    const newRefresh = getCookie(res, 'cc_refresh')
    expect(newRefresh).toBeDefined()

    // El refresh token nuevo es distinto al anterior (rotación real)
    rotatedRefreshToken = newRefresh!.value
    expect(rotatedRefreshToken).not.toBe(initialRefreshToken)
  })

  it('refresh-old-revoked: refresh token anterior (ya rotado) → 401 refresh_revoked', async () => {
    // Este test depende de que refresh-ok haya rotado initialRefreshToken
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/refresh',
      cookies: { cc_refresh: initialRefreshToken },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json<{ error: string }>().error).toBe('refresh_revoked')
  })

  it('refresh-no-cookie: sin cc_refresh → 401 no_refresh_cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/api/auth/refresh',
    })

    expect(res.statusCode).toBe(401)
    expect(res.json<{ error: string }>().error).toBe('no_refresh_cookie')
  })

  it('refresh-invalid: token basura → 401 refresh_invalid', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/refresh',
      cookies: { cc_refresh: 'TOKEN_BASURA_QUE_NO_EXISTE_EN_DB' },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json<{ error: string }>().error).toBe('refresh_invalid')
  })
})

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  let refreshToken: string
  let csrfToken:    string

  beforeAll(async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })
    refreshToken = getCookie(res, 'cc_refresh')!.value
    csrfToken    = getCookie(res, 'cc_csrf')!.value
  })

  it('logout-ok: con CSRF válido → 200 { ok: true } y refresh token revocado en DB', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/logout',
      cookies: { cc_refresh: refreshToken, cc_csrf: csrfToken },
      headers: { 'x-csrf-token': csrfToken },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json<{ ok: boolean }>().ok).toBe(true)

    // El refresh token fue revocado en DB → intentar usarlo debe fallar
    const refreshRes = await app.inject({
      method:  'POST',
      url:     '/api/auth/refresh',
      cookies: { cc_refresh: refreshToken },
    })
    expect(refreshRes.statusCode).toBe(401)
  })

  it('logout-no-csrf: sin X-CSRF-Token header → 403 csrf_invalid', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/logout',
      cookies: { cc_csrf: csrfToken },
      // sin el header x-csrf-token
    })

    expect(res.statusCode).toBe(403)
    expect(res.json<{ error: string }>().error).toBe('csrf_invalid')
  })
})

// ── CSRF protection ───────────────────────────────────────────────────────────

describe('CSRF protection', () => {
  let csrfToken: string

  beforeAll(async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })
    csrfToken = getCookie(res, 'cc_csrf')!.value
  })

  it('csrf-skip-get: GET sin X-CSRF-Token nunca devuelve 403', async () => {
    // Sin cc_access → 401; con cc_access → 200; pero NUNCA 403
    const res = await app.inject({ method: 'GET', url: '/api/auth/owner/me' })
    expect(res.statusCode).not.toBe(403)
  })

  it('csrf-skip-login: POST /login sin X-CSRF-Token no es 403', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/owner/login',
      payload: { email: TEST_EMAIL, password: TEST_PASSWORD },
    })
    // 200 (credenciales correctas) pero NUNCA 403
    expect(res.statusCode).not.toBe(403)
  })

  it('csrf-skip-refresh: POST /refresh sin X-CSRF-Token no es 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/api/auth/refresh',
      // sin cookies → 401 (no refresh cookie), pero NUNCA 403 (ruta excluida del CSRF)
    })
    expect(res.statusCode).not.toBe(403)
    expect(res.statusCode).toBe(401)
  })

  it('csrf-no-header: ruta protegida con cc_csrf cookie pero sin header → 403 csrf_invalid', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/logout',
      cookies: { cc_csrf: csrfToken },
      // sin el header x-csrf-token
    })

    expect(res.statusCode).toBe(403)
    expect(res.json<{ error: string }>().error).toBe('csrf_invalid')
  })

  it('csrf-mismatch: X-CSRF-Token ≠ cc_csrf cookie → 403 csrf_invalid', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/logout',
      cookies: { cc_csrf: csrfToken },
      headers: { 'x-csrf-token': 'VALOR_INCORRECTO' },
    })

    expect(res.statusCode).toBe(403)
    expect(res.json<{ error: string }>().error).toBe('csrf_invalid')
  })
})
