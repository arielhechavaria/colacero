/**
 * Validación de slugs para negocios en ColaCero.
 *
 * Un slug es el identificador de un negocio en la URL:
 *   el-fogon.colacero.com  →  slug: "el-fogon"
 *
 * Reglas:
 *   - 3–32 caracteres
 *   - Solo a-z, 0-9 y guiones internos
 *   - No puede empezar ni terminar con guión
 *   - No puede ser una palabra reservada del sistema
 *   - No puede ser una marca conocida (protección básica anti-squatting)
 */

// Regex: mínimo 3 chars, solo a-z0-9 y guiones internos
export const SLUG_RE = /^[a-z0-9]([a-z0-9-]{1,30}[a-z0-9])?$/

/**
 * Palabras reservadas del sistema (subdominios con uso técnico o de plataforma).
 * Cualquier slug en esta lista → bloqueado.
 */
export const RESERVED_SLUGS = new Set([
  // Infraestructura y plataforma
  'api', 'panel', 'admin', 'www', 'mail', 'static',
  'auth', 'signup', 'catalog', 'assets', 'cdn',
  'app', 'dashboard', 'portal', 'store', 'shop',
  'help', 'support', 'status', 'blog', 'docs',
  'dev', 'staging', 'test', 'demo', 'sandbox', 'beta',
  'internal', 'system', 'root', 'superadmin',
  'colacero', 'cola', 'cero',

  // Palabras genéricas que no deben ser slugs
  'nuevo', 'new', 'login', 'register', 'reset',
  'account', 'profile', 'settings', 'billing',
  'home', 'about', 'contact', 'privacy', 'terms',
  'health', 'metrics', 'monitor',
])

/**
 * Marcas conocidas — protección básica anti-squatting.
 * Lista corta y pragmática: marcas globales + las más relevantes en Cuba.
 */
export const BRAND_SLUGS = new Set([
  // Refrescos / food
  'coca-cola', 'cocacola', 'pepsi', 'sprite', 'fanta',
  'mcdonalds', 'mcdonald', 'kfc', 'burger-king', 'burgerking',
  'subway', 'dominos', 'pizzahut', 'pizza-hut',
  // Tech
  'google', 'facebook', 'meta', 'instagram', 'whatsapp',
  'twitter', 'tiktok', 'youtube', 'netflix', 'amazon',
  'apple', 'microsoft', 'paypal', 'shopify', 'stripe',
  // Marcas cubanas / regionales
  'cimex', 'etecsa', 'mipyme', 'bitpymes', 'transfermovil',
])

export type SlugValidationError =
  | 'too_short'
  | 'too_long'
  | 'invalid_chars'
  | 'reserved'
  | 'brand_protected'

export interface SlugValidation {
  valid: boolean
  error?: SlugValidationError
}

/**
 * Valida un slug de negocio.
 * Devuelve { valid: true } o { valid: false, error: '...' }.
 */
export function validateSlug(slug: string): SlugValidation {
  if (slug.length < 3)  return { valid: false, error: 'too_short' }
  if (slug.length > 32) return { valid: false, error: 'too_long' }
  if (!SLUG_RE.test(slug)) return { valid: false, error: 'invalid_chars' }
  if (RESERVED_SLUGS.has(slug)) return { valid: false, error: 'reserved' }
  if (BRAND_SLUGS.has(slug))    return { valid: false, error: 'brand_protected' }
  return { valid: true }
}

/** Devuelve true si el slug está bloqueado (reservado o marca protegida). */
export function isSlugBlocked(slug: string): boolean {
  return RESERVED_SLUGS.has(slug) || BRAND_SLUGS.has(slug)
}
