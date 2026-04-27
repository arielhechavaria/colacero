import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  // ── Base de datos ──────────────────────────────────────────────────
  DATABASE_URL: z.string().url(),

  // ── Redis ──────────────────────────────────────────────────────────
  REDIS_URL: z.string().url(),

  // ── API ────────────────────────────────────────────────────────────
  API_PORT: z.coerce.number().int().min(1024).max(65535).default(3000),
  API_HOST: z.string().default('0.0.0.0'),

  // ── JWT (auth panel dueño) ─────────────────────────────────────────
  JWT_SECRET:     z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // ── OTP cliente ────────────────────────────────────────────────────
  OTP_TTL_SECONDS: z.coerce.number().int().default(600),

  // ── WhatsApp ───────────────────────────────────────────────────────
  WHATSAPP_PROVIDER:        z.enum(['meta-cloud', 'mock']).default('mock'),
  WHATSAPP_API_TOKEN:       z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
})

export type EnvSchema = z.infer<typeof envSchema>
