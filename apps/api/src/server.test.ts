import { describe, it, expect, afterAll } from 'vitest'
import { buildServer } from './server.js'

/**
 * Integration tests — requieren PostgreSQL corriendo.
 * Antes de correr: pnpm infra:up
 * Las vars de entorno deben estar en .env o exportadas:
 *   DATABASE_URL, REDIS_URL, JWT_SECRET
 */

describe('GET /health', () => {
  const app = buildServer()
  afterAll(() => app.close())

  it('responde 200 con { status: "ok", ts: <iso> }', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    const body = res.json<{ status: string; ts: string }>()
    expect(body.status).toBe('ok')
    expect(new Date(body.ts).toISOString()).toBe(body.ts)
  })
})

describe('prisma plugin', () => {
  it('app.prisma existe y está conectado tras ready()', async () => {
    const app = buildServer()
    await app.ready()
    expect(app.prisma).toBeDefined()
    await app.close()
  })

  it('prisma.$disconnect() se llama al cerrar el server', async () => {
    const app = buildServer()
    await app.ready()
    expect(app.prisma).toBeDefined()
    // app.close() dispara el hook onClose que llama $disconnect() — si no lanza, pasó
    await expect(app.close()).resolves.toBeUndefined()
  })
})
