import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../../services/auth.service.js'

describe('auth.service — password hashing', () => {
  it('auth-hash-verify: verifyPassword devuelve true con contraseña correcta', async () => {
    const hash = await hashPassword('miContraseña123!')
    expect(await verifyPassword('miContraseña123!', hash)).toBe(true)
  })

  it('auth-hash-wrong: verifyPassword devuelve false con contraseña incorrecta', async () => {
    const hash = await hashPassword('miContraseña123!')
    expect(await verifyPassword('otraContraseña', hash)).toBe(false)
  })

  it('auth-hash-unique: dos hashes del mismo password son distintos (salt aleatorio)', async () => {
    const hash1 = await hashPassword('misma')
    const hash2 = await hashPassword('misma')
    expect(hash1).not.toBe(hash2)
    expect(await verifyPassword('misma', hash1)).toBe(true)
    expect(await verifyPassword('misma', hash2)).toBe(true)
  })
})
