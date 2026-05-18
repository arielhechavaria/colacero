import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest'
import { PrismaClient } from '@colacero/db'
import {
  hashToken,
  issueRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllForUser,
  TokenError,
} from '../../services/token.service.js'

/**
 * Unit tests del token.service — usan Prisma directamente, sin HTTP.
 * Requieren PostgreSQL corriendo: pnpm infra:up
 */

const prisma = new PrismaClient()

const TEST_EMAIL = 'test-token@elfogon.cu'
const TEST_SLUG  = 'el-fogon'

let testBusinessId: string
let testUserId:     string

beforeAll(async () => {
  const business = await prisma.business.upsert({
    where:  { slug: TEST_SLUG },
    update: {},
    create: { slug: TEST_SLUG, name: 'El Fogón (test)' },
  })
  testBusinessId = business.id

  const user = await prisma.user.upsert({
    where:  { email: TEST_EMAIL },
    update: {},
    create: {
      businessId:   testBusinessId,
      email:        TEST_EMAIL,
      passwordHash: 'placeholder',
      role:         'OWNER',
    },
  })
  testUserId = user.id
})

afterEach(async () => {
  // Limpiar tokens del test anterior para evitar contaminación
  await prisma.refreshToken.deleteMany({ where: { userId: testUserId } })
})

afterAll(async () => {
  await prisma.refreshToken.deleteMany({ where: { userId: testUserId } })
  await prisma.user.deleteMany({ where: { email: TEST_EMAIL } })
  await prisma.$disconnect()
})

// ── hashToken ─────────────────────────────────────────────────────────────────

describe('hashToken', () => {
  it('hash-deterministic: mismo input → mismo hash', () => {
    expect(hashToken('abc123')).toBe(hashToken('abc123'))
  })

  it('hash-unique: inputs distintos → hashes distintos', () => {
    expect(hashToken('abc')).not.toBe(hashToken('xyz'))
  })

  it('hash-no-raw: el hash es distinto al raw (nunca se guarda el token en crudo)', () => {
    const raw = 'miTokenSecreto'
    expect(hashToken(raw)).not.toBe(raw)
  })
})

// ── issueRefreshToken ─────────────────────────────────────────────────────────

describe('issueRefreshToken', () => {
  it('issue-ok: crea fila en DB, devuelve raw + csrf + id + expiresAt', async () => {
    const pair = await issueRefreshToken(prisma, { userId: testUserId })

    expect(pair.refreshTokenRaw).toBeTruthy()
    expect(pair.csrfToken).toBeTruthy()
    expect(pair.refreshTokenId).toBeTruthy()
    expect(pair.refreshExpiresAt).toBeInstanceOf(Date)
    expect(pair.refreshExpiresAt.getTime()).toBeGreaterThan(Date.now())

    // La DB guarda el HASH, no el token crudo
    const row = await prisma.refreshToken.findUnique({ where: { id: pair.refreshTokenId } })
    expect(row).not.toBeNull()
    expect(row?.tokenHash).toBe(hashToken(pair.refreshTokenRaw))
    expect(row?.revokedAt).toBeNull()
    expect(row?.userId).toBe(testUserId)
  })

  it('issue-guard-no-principal: sin userId ni customerId → throw', async () => {
    await expect(issueRefreshToken(prisma, {})).rejects.toThrow()
  })

  it('issue-guard-both: userId Y customerId → throw', async () => {
    await expect(
      issueRefreshToken(prisma, { userId: testUserId, customerId: 'fake-customer-id' }),
    ).rejects.toThrow()
  })
})

// ── rotateRefreshToken ────────────────────────────────────────────────────────

describe('rotateRefreshToken', () => {
  it('rotate-ok: viejo token revocado, nuevo token emitido', async () => {
    const first = await issueRefreshToken(prisma, { userId: testUserId })

    const result = await rotateRefreshToken(prisma, { rawRefresh: first.refreshTokenRaw })

    // Viejo token debe tener revokedAt
    const oldRow = await prisma.refreshToken.findUnique({ where: { id: first.refreshTokenId } })
    expect(oldRow?.revokedAt).not.toBeNull()

    // Nuevo token emitido con raw distinto
    expect(result.pair.refreshTokenRaw).toBeTruthy()
    expect(result.pair.refreshTokenRaw).not.toBe(first.refreshTokenRaw)
    expect(result.userId).toBe(testUserId)
    expect(result.type).toBe('user')
    expect(result.user?.id).toBe(testUserId)
  })

  it('rotate-invalid: token no existe en DB → TokenError refresh_invalid', async () => {
    const err = await rotateRefreshToken(prisma, {
      rawRefresh: 'TOKEN_QUE_NO_EXISTE_EN_LA_DB',
    }).catch(e => e)

    expect(err).toBeInstanceOf(TokenError)
    expect((err as TokenError).code).toBe('refresh_invalid')
  })

  it('rotate-expired: token con expiresAt en el pasado → TokenError refresh_expired', async () => {
    const raw = 'test-expired-' + Date.now()
    await prisma.refreshToken.create({
      data: {
        userId:    testUserId,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() - 60_000), // 1 minuto en el pasado
      },
    })

    const err = await rotateRefreshToken(prisma, { rawRefresh: raw }).catch(e => e)

    expect(err).toBeInstanceOf(TokenError)
    expect((err as TokenError).code).toBe('refresh_expired')
  })

  it('rotate-theft: token ya revocado → TokenError refresh_revoked + todos los tokens activos revocados', async () => {
    // Emitir dos tokens para el mismo usuario
    const t1 = await issueRefreshToken(prisma, { userId: testUserId })
    const t2 = await issueRefreshToken(prisma, { userId: testUserId })

    // Rotar t1 normalmente: t1 revocado, t3 emitido
    await rotateRefreshToken(prisma, { rawRefresh: t1.refreshTokenRaw })

    // Reutilizar t1 (ya revocado) → detección de robo
    const err = await rotateRefreshToken(prisma, {
      rawRefresh: t1.refreshTokenRaw,
    }).catch(e => e)

    expect(err).toBeInstanceOf(TokenError)
    expect((err as TokenError).code).toBe('refresh_revoked')

    // t2 (que estaba activo) debe quedar revocado también (daño colateral)
    const t2Row = await prisma.refreshToken.findUnique({ where: { id: t2.refreshTokenId } })
    expect(t2Row?.revokedAt).not.toBeNull()
  })
})

// ── revokeRefreshToken ────────────────────────────────────────────────────────

describe('revokeRefreshToken', () => {
  it('revoke-ok: marca revokedAt en el token correspondiente', async () => {
    const pair = await issueRefreshToken(prisma, { userId: testUserId })

    await revokeRefreshToken(prisma, pair.refreshTokenRaw)

    const row = await prisma.refreshToken.findUnique({ where: { id: pair.refreshTokenId } })
    expect(row?.revokedAt).not.toBeNull()
  })

  it('revoke-idempotent: revocar un token ya revocado no lanza error', async () => {
    const pair = await issueRefreshToken(prisma, { userId: testUserId })
    await revokeRefreshToken(prisma, pair.refreshTokenRaw)

    // Segunda revocación — no debe lanzar
    await expect(revokeRefreshToken(prisma, pair.refreshTokenRaw)).resolves.toBeUndefined()
  })
})

// ── revokeAllForUser ──────────────────────────────────────────────────────────

describe('revokeAllForUser', () => {
  it('revoke-all-ok: revoca todos los tokens activos y devuelve el count', async () => {
    // Crear 3 tokens frescos
    await issueRefreshToken(prisma, { userId: testUserId })
    await issueRefreshToken(prisma, { userId: testUserId })
    await issueRefreshToken(prisma, { userId: testUserId })

    const count = await revokeAllForUser(prisma, testUserId)

    expect(count).toBe(3)

    // Verificar en DB que no quedan tokens activos
    const active = await prisma.refreshToken.count({
      where: { userId: testUserId, revokedAt: null },
    })
    expect(active).toBe(0)
  })

  it('revoke-all-empty: sin tokens activos → count 0', async () => {
    const count = await revokeAllForUser(prisma, testUserId)
    expect(count).toBe(0)
  })
})
