import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { Redis } from 'ioredis'
import { PrismaClient } from '@colacero/db'
import { buildServer } from '../../server.js'

/**
 * Integration tests — requieren PostgreSQL + Redis corriendo.
 * Antes de correr: pnpm infra:up
 */

const redis  = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379')
const prisma = new PrismaClient()
const app    = buildServer()

const TEST_PHONE = '+5355500099'

type InjectResponse = Awaited<ReturnType<typeof app.inject>>

function getCookie(res: InjectResponse, name: string) {
  return res.cookies.find(c => c.name === name)
}

beforeAll(async () => {
  await app.ready()
  await redis.del(`otp:${TEST_PHONE}`)
  await prisma.refreshToken.deleteMany({ where: { customer: { phone: TEST_PHONE } } })
  await prisma.customer.deleteMany({ where: { phone: TEST_PHONE } })
})

afterAll(async () => {
  await redis.del(`otp:${TEST_PHONE}`)
  await prisma.refreshToken.deleteMany({ where: { customer: { phone: TEST_PHONE } } })
  await prisma.customer.deleteMany({ where: { phone: TEST_PHONE } })
  await prisma.$disconnect()
  await redis.quit()
  await app.close()
})

// ── POST /api/auth/customer/request-otp ──────────────────────────────────────

describe('POST /api/auth/customer/request-otp', () => {
  it('request-otp-ok: phone E.164 válido → 200 { ok: true } y OTP guardado en Redis', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/customer/request-otp',
      payload: { phone: TEST_PHONE },
    })

    expect(res.statusCode).toBe(200)
    expect(res.json<{ ok: boolean }>().ok).toBe(true)

    const stored = await redis.get(`otp:${TEST_PHONE}`)
    expect(stored).toMatch(/^\d{6}$/)
  })

  it('request-otp-invalid-phone: phone sin formato E.164 → 422', async () => {
    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/customer/request-otp',
      payload: { phone: '55500099' },
    })

    expect(res.statusCode).toBe(422)
    expect(res.json<{ error: string }>().error).toBe('validation_error')
  })
})

// ── POST /api/auth/customer/verify-otp ───────────────────────────────────────

describe('POST /api/auth/customer/verify-otp', () => {
  it('verify-otp-ok: OTP correcto → 200 con { customer }, 3 cookies; token NO en body', async () => {
    await app.inject({
      method:  'POST',
      url:     '/api/auth/customer/request-otp',
      payload: { phone: TEST_PHONE },
    })
    const otp = await redis.get(`otp:${TEST_PHONE}`)

    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/customer/verify-otp',
      payload: { phone: TEST_PHONE, otp },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json<{ customer: { id: string; phone: string } }>()

    // El token NO debe viajar en el body
    expect((body as Record<string, unknown>).token).toBeUndefined()
    expect(body.customer.phone).toBe(TEST_PHONE)

    // Las cookies de sesión deben estar presentes
    const access = getCookie(res, 'cc_access')
    const csrf   = getCookie(res, 'cc_csrf')
    expect(access).toBeDefined()
    expect(access?.httpOnly).toBe(true)
    expect(csrf).toBeDefined()
    expect(csrf?.httpOnly).toBe(false)
  })

  it('verify-otp-creates-customer: primer login crea Customer en DB', async () => {
    const customer = await prisma.customer.findUnique({ where: { phone: TEST_PHONE } })
    expect(customer).not.toBeNull()
    expect(customer?.phone).toBe(TEST_PHONE)
  })

  it('verify-otp-wrong: OTP incorrecto → 401 invalid_otp', async () => {
    await app.inject({
      method:  'POST',
      url:     '/api/auth/customer/request-otp',
      payload: { phone: TEST_PHONE },
    })

    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/customer/verify-otp',
      payload: { phone: TEST_PHONE, otp: '000000' },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json<{ error: string }>().error).toBe('invalid_otp')
  })

  it('verify-otp-consumed: mismo OTP dos veces → segunda vez 401', async () => {
    await app.inject({
      method:  'POST',
      url:     '/api/auth/customer/request-otp',
      payload: { phone: TEST_PHONE },
    })
    const otp = await redis.get(`otp:${TEST_PHONE}`)

    await app.inject({
      method:  'POST',
      url:     '/api/auth/customer/verify-otp',
      payload: { phone: TEST_PHONE, otp },
    })

    const res = await app.inject({
      method:  'POST',
      url:     '/api/auth/customer/verify-otp',
      payload: { phone: TEST_PHONE, otp },
    })

    expect(res.statusCode).toBe(401)
    expect(res.json<{ error: string }>().error).toBe('invalid_otp')
  })

  it('verify-otp-updates-lastLoginAt: segundo login actualiza lastLoginAt', async () => {
    const before = await prisma.customer.findUnique({ where: { phone: TEST_PHONE } })

    await app.inject({
      method:  'POST',
      url:     '/api/auth/customer/request-otp',
      payload: { phone: TEST_PHONE },
    })
    const otp = await redis.get(`otp:${TEST_PHONE}`)
    await app.inject({
      method:  'POST',
      url:     '/api/auth/customer/verify-otp',
      payload: { phone: TEST_PHONE, otp },
    })

    const after = await prisma.customer.findUnique({ where: { phone: TEST_PHONE } })
    expect(after?.lastLoginAt).not.toBeNull()
    if (before?.lastLoginAt && after?.lastLoginAt) {
      expect(after.lastLoginAt.getTime()).toBeGreaterThanOrEqual(before.lastLoginAt.getTime())
    }
  })
})
