import { describe, it, expect } from 'vitest'
import { envSchema } from './schema.js'

const VALID = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/testdb',
  REDIS_URL:    'redis://localhost:6379',
  JWT_SECRET:   'esta-clave-tiene-exactamente-32-chars-ok!!',
}

describe('envSchema — unit tests', () => {
  it('env-valid: acepta vars requeridas y aplica defaults correctos', () => {
    const r = envSchema.safeParse(VALID)
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.NODE_ENV).toBe('development')
    expect(r.data.API_PORT).toBe(3000)
    expect(r.data.API_HOST).toBe('0.0.0.0')
    expect(r.data.OTP_TTL_SECONDS).toBe(600)
    expect(r.data.WHATSAPP_PROVIDER).toBe('mock')
    expect(r.data.JWT_EXPIRES_IN).toBe('7d')
  })

  it('env-missing-jwt: falla sin JWT_SECRET', () => {
    const r = envSchema.safeParse({
      DATABASE_URL: VALID.DATABASE_URL,
      REDIS_URL:    VALID.REDIS_URL,
    })
    expect(r.success).toBe(false)
    if (r.success) return
    expect(r.error.flatten().fieldErrors['JWT_SECRET']).toBeDefined()
  })

  it('env-short-jwt: falla si JWT_SECRET < 32 chars', () => {
    const r = envSchema.safeParse({ ...VALID, JWT_SECRET: 'corto' })
    expect(r.success).toBe(false)
    if (r.success) return
    expect(r.error.flatten().fieldErrors['JWT_SECRET']).toBeDefined()
  })

  it('env-invalid-db-url: falla si DATABASE_URL no es URL válida', () => {
    const r = envSchema.safeParse({ ...VALID, DATABASE_URL: 'not-a-url' })
    expect(r.success).toBe(false)
    if (r.success) return
    expect(r.error.flatten().fieldErrors['DATABASE_URL']).toBeDefined()
  })

  it('env-defaults: con solo las vars requeridas el resto usa defaults', () => {
    const r = envSchema.safeParse(VALID)
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data.API_PORT).toBe(3000)
    expect(r.data.API_HOST).toBe('0.0.0.0')
    expect(r.data.JWT_EXPIRES_IN).toBe('7d')
    expect(r.data.OTP_TTL_SECONDS).toBe(600)
    expect(r.data.WHATSAPP_PROVIDER).toBe('mock')
  })
})
