import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest'
import { Redis } from 'ioredis'
import { generateOtp, storeOtp, verifyAndConsumeOtp } from '../../services/otp.service.js'

const redis = new Redis(process.env['REDIS_URL'] ?? 'redis://localhost:6379')
const TEST_PHONE = '+5355500001'

beforeEach(async () => {
  await redis.del(`otp:${TEST_PHONE}`)
})

afterEach(async () => {
  await redis.del(`otp:${TEST_PHONE}`)
})

afterAll(async () => {
  await redis.quit()
})

describe('otp.service — generateOtp', () => {
  it('otp-format: retorna exactamente 6 dígitos numéricos', () => {
    const otp = generateOtp()
    expect(otp).toMatch(/^\d{6}$/)
  })

  it('otp-unique: dos llamadas consecutivas casi nunca son iguales', () => {
    const results = new Set(Array.from({ length: 20 }, () => generateOtp()))
    expect(results.size).toBeGreaterThan(1)
  })
})

describe('otp.service — verifyAndConsumeOtp', () => {
  it('otp-verify-ok: retorna true con OTP correcto', async () => {
    await storeOtp(redis, TEST_PHONE, '123456', 600)
    expect(await verifyAndConsumeOtp(redis, TEST_PHONE, '123456')).toBe(true)
  })

  it('otp-verify-wrong: retorna false con OTP incorrecto', async () => {
    await storeOtp(redis, TEST_PHONE, '123456', 600)
    expect(await verifyAndConsumeOtp(redis, TEST_PHONE, '999999')).toBe(false)
  })

  it('otp-verify-consumed: retorna false la segunda vez (consume-on-success)', async () => {
    await storeOtp(redis, TEST_PHONE, '123456', 600)
    expect(await verifyAndConsumeOtp(redis, TEST_PHONE, '123456')).toBe(true)
    expect(await verifyAndConsumeOtp(redis, TEST_PHONE, '123456')).toBe(false)
  })

  it('otp-verify-no-key: retorna false si no existe OTP en Redis', async () => {
    expect(await verifyAndConsumeOtp(redis, TEST_PHONE, '123456')).toBe(false)
  })
})
