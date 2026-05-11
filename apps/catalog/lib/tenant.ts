/**
 * Parsea el subdominio del header Host para determinar qué tenant servir.
 *
 * Ejemplos:
 *   elfogon.colacero.com  → { kind: 'tenant', slug: 'elfogon' }
 *   colacero.com          → { kind: 'root' }
 *   www.colacero.com      → { kind: 'root' }
 *   api.colacero.com      → { kind: 'reserved', name: 'api' }
 *   localhost:3001        → { kind: 'local' }
 */

const BASE_DOMAIN = 'colacero.com'

const RESERVED = new Set([
  'api', 'panel', 'admin', 'www', 'mail', 'static',
  'auth', 'signup', 'catalog', 'assets', 'cdn',
])

// Mismo regex que el plan: 3-32 chars, solo a-z0-9 y guiones internos
const SLUG_RE = /^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])?$/

export type TenantResult =
  | { kind: 'tenant';   slug: string }
  | { kind: 'root' }
  | { kind: 'reserved'; name: string }
  | { kind: 'local' }

export function parseTenantFromHost(host: string | null | undefined): TenantResult {
  if (!host) return { kind: 'local' }

  // Quitar puerto (:3001, :443, etc.)
  const hostname = host.split(':')[0]!

  // Desarrollo local
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { kind: 'local' }
  }

  // Dominio raíz sin subdominio
  if (hostname === BASE_DOMAIN) return { kind: 'root' }

  // Tiene que terminar en .colacero.com
  if (!hostname.endsWith(`.${BASE_DOMAIN}`)) return { kind: 'local' }

  // Extraer subdominio
  const sub = hostname.slice(0, hostname.length - BASE_DOMAIN.length - 1)

  if (!sub) return { kind: 'root' }
  if (sub === 'www') return { kind: 'root' }
  if (RESERVED.has(sub)) return { kind: 'reserved', name: sub }
  if (!SLUG_RE.test(sub)) return { kind: 'root' }

  return { kind: 'tenant', slug: sub }
}
