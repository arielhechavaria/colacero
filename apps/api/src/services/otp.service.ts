import { randomInt } from 'node:crypto'
import type { Redis } from 'ioredis'

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
}

export async function storeOtp(redis: Redis, phone: string, otp: string, ttlSeconds: number): Promise<void> {
  await redis.set(`otp:${phone}`, otp, 'EX', ttlSeconds)
}

export async function verifyAndConsumeOtp(redis: Redis, phone: string, otp: string): Promise<boolean> {
  const stored = await redis.get(`otp:${phone}`)
  if (!stored || stored !== otp) return false
  await redis.del(`otp:${phone}`)
  return true
}
