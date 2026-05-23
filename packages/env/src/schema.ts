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
  JWT_EXPIRES_IN: z.string().default('7d'), // legacy — usar ACCESS_TOKEN_EXPIRES_IN

  // ── Cookies + Refresh tokens ───────────────────────────────────────
  COOKIE_SECRET:            z.string().min(32),
  ACCESS_TOKEN_EXPIRES_IN:  z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  REFRESH_TOKEN_TTL_DAYS:   z.coerce.number().int().default(30),

  // ── OTP cliente ────────────────────────────────────────────────────
  OTP_TTL_SECONDS: z.coerce.number().int().default(600),

  // ── WhatsApp ───────────────────────────────────────────────────────
  WHATSAPP_PROVIDER:        z.enum(['meta-cloud', 'mock']).default('mock'),
  WHATSAPP_API_TOKEN:       z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),

  // ── Telegram ───────────────────────────────────────────────────────
  TELEGRAM_PROVIDER:       z.enum(['bot-api', 'mock']).default('mock'),
  TELEGRAM_BOT_TOKEN:      z.string().optional(), // bot de notificaciones (ej. @elfogon_colaCero_Bot)
  TELEGRAM_AUTH_BOT_TOKEN: z.string().optional(), // bot de auth (Login Widget — ej. @Colacero); fallback a TELEGRAM_BOT_TOKEN
  TELEGRAM_CHANNEL_ID:     z.string().optional(), // canal público de anuncios
  TELEGRAM_NOTIFY_CHAT_ID: z.string().optional(), // grupo interno del negocio
  CATALOG_URL:             z.string().url().optional(), // URL pública del catálogo (Mini App button)

  // ── Upload de archivos ────────────────────────────────────────────
  UPLOAD_DIR:      z.string().default('./uploads'),
  API_PUBLIC_URL:  z.string().url().default('http://localhost:3000'),

  // ── Email / Password reset ────────────────────────────────────────
  RESEND_API_KEY:             z.string().optional(),
  FROM_EMAIL:                 z.string().email().optional(),
  PASSWORD_RESET_TTL_MINUTES:    z.coerce.number().int().default(60),
  EMAIL_VERIFICATION_TTL_HOURS:  z.coerce.number().int().default(24),
  PANEL_URL:                     z.string().url().default('http://localhost:3002'),

  // ── IA (Anthropic Claude para generar anuncios) ────────────────────
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL:   z.string().default('claude-3-5-sonnet-20241022'),
})

export type EnvSchema = z.infer<typeof envSchema>
