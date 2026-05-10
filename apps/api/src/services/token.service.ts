import crypto from 'node:crypto'
import type { PrismaClient } from '@colacero/db'
import { env } from '@colacero/env'

export const ACCESS_COOKIE  = 'cc_access'
export const REFRESH_COOKIE = 'cc_refresh'
export const CSRF_COOKIE    = 'cc_csrf'

export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function genOpaque(): string {
  return crypto.randomBytes(32).toString('base64url')
}

export interface IssuePairInput {
  userId?:     string | undefined
  customerId?: string | undefined
  userAgent?:  string | undefined
  ipAddress?:  string | undefined
}

export interface TokenPair {
  refreshTokenRaw:  string
  refreshTokenId:   string
  refreshExpiresAt: Date
  csrfToken:        string
}

export class TokenError extends Error {
  constructor(public code: 'refresh_invalid' | 'refresh_expired' | 'refresh_revoked') {
    super(code)
  }
}

export async function issueRefreshToken(
  prisma: PrismaClient,
  input: IssuePairInput
): Promise<TokenPair> {
  if (!input.userId && !input.customerId) {
    throw new Error('issueRefreshToken: must supply userId or customerId')
  }
  if (input.userId && input.customerId) {
    throw new Error('issueRefreshToken: cannot supply BOTH userId and customerId')
  }

  const raw       = genOpaque()
  const csrf      = genOpaque()
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  const row = await prisma.refreshToken.create({
    data: {
      userId:     input.userId     ?? null,
      customerId: input.customerId ?? null,
      tokenHash:  hashToken(raw),
      expiresAt,
      userAgent:  input.userAgent  ?? null,
      ipAddress:  input.ipAddress  ?? null,
    },
  })

  return {
    refreshTokenRaw:  raw,
    refreshTokenId:   row.id,
    refreshExpiresAt: expiresAt,
    csrfToken:        csrf,
  }
}

export interface RotateInput {
  rawRefresh: string
  userAgent?: string | undefined
  ipAddress?: string | undefined
}

export interface RotateResult {
  type:        'user' | 'customer'
  userId?:     string | undefined
  customerId?: string | undefined
  pair:        TokenPair
  user?:       { id: string; businessId: string; role: string; email: string } | undefined
  customer?:   { id: string; telegramId: string | null; phone: string | null } | undefined
}

export async function rotateRefreshToken(
  prisma: PrismaClient,
  input: RotateInput
): Promise<RotateResult> {
  const hash = hashToken(input.rawRefresh)
  const row  = await prisma.refreshToken.findUnique({
    where:   { tokenHash: hash },
    include: { user: true, customer: true },
  })

  if (!row) {
    throw new TokenError('refresh_invalid')
  }
  if (row.expiresAt < new Date()) {
    throw new TokenError('refresh_expired')
  }
  if (row.revokedAt) {
    // Reuse of revoked token = theft. Revoke ALL tokens for that principal.
    if (row.userId) {
      await prisma.refreshToken.updateMany({
        where: { userId: row.userId, revokedAt: null },
        data:  { revokedAt: new Date() },
      })
    } else if (row.customerId) {
      await prisma.refreshToken.updateMany({
        where: { customerId: row.customerId, revokedAt: null },
        data:  { revokedAt: new Date() },
      })
    }
    throw new TokenError('refresh_revoked')
  }

  // Mark old as revoked
  await prisma.refreshToken.update({
    where: { id: row.id },
    data:  { revokedAt: new Date() },
  })

  // Issue new pair
  const pair = await issueRefreshToken(prisma, {
    userId:     row.userId     ?? undefined,
    customerId: row.customerId ?? undefined,
    userAgent:  input.userAgent,
    ipAddress:  input.ipAddress,
  })

  return {
    type:       row.userId ? 'user' : 'customer',
    userId:     row.userId     ?? undefined,
    customerId: row.customerId ?? undefined,
    pair,
    user:       row.user
      ? { id: row.user.id, businessId: row.user.businessId, role: row.user.role, email: row.user.email }
      : undefined,
    customer:   row.customer
      ? { id: row.customer.id, telegramId: row.customer.telegramId, phone: row.customer.phone }
      : undefined,
  }
}

export async function revokeRefreshToken(prisma: PrismaClient, rawRefresh: string): Promise<void> {
  const hash = hashToken(rawRefresh)
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hash, revokedAt: null },
    data:  { revokedAt: new Date() },
  })
}

export async function revokeAllForUser(prisma: PrismaClient, userId: string): Promise<number> {
  const r = await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data:  { revokedAt: new Date() },
  })
  return r.count
}

export async function revokeAllForCustomer(prisma: PrismaClient, customerId: string): Promise<number> {
  const r = await prisma.refreshToken.updateMany({
    where: { customerId, revokedAt: null },
    data:  { revokedAt: new Date() },
  })
  return r.count
}
