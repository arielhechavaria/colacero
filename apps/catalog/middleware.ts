import { type NextRequest, NextResponse } from 'next/server'
import { parseTenantFromHost } from './lib/tenant'

/**
 * Middleware de subdominio para ColaCero.
 *
 * elfogon.colacero.com/         → rewrite → /elfogon
 * elfogon.colacero.com/checkout → rewrite → /elfogon/checkout
 * colacero.com/elfogon          → redirect 301 → elfogon.colacero.com
 * colacero.com/                 → next() (landing futura)
 * api.colacero.com              → next() (reservado, nginx lo maneja)
 */
export function middleware(req: NextRequest) {
  const host    = req.headers.get('host')
  const result  = parseTenantFromHost(host)
  const { pathname } = req.nextUrl

  // ── Subdominio de tenant: rewrite /pathname → /[slug]/pathname ────────────
  if (result.kind === 'tenant') {
    const { slug } = result

    // Evitar loops: si ya empieza con /[slug] no reescribir
    if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) {
      return NextResponse.next()
    }

    const url      = req.nextUrl.clone()
    url.pathname   = pathname === '/' ? `/${slug}` : `/${slug}${pathname}`
    return NextResponse.rewrite(url)
  }

  // ── Dominio raíz con path de negocio: redirect 301 a subdominio ───────────
  // colacero.com/elfogon → elfogon.colacero.com
  // EXCEPCIONES: rutas reservadas de marketing/manual que viven en el apex
  const RESERVED_APEX_PATHS = [
    '/manual',
    '/precios',
    '/faq',
    '/about',
    '/contacto',
    '/opengraph-image',
    '/api',
    '/_next',
  ]

  if (result.kind === 'root') {
    const isReserved = RESERVED_APEX_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    )
    if (!isReserved) {
      const match = pathname.match(/^\/([a-z0-9][a-z0-9-]{1,30}[a-z0-9])(\/.*)?$/)
      if (match) {
        const slug    = match[1]!
        const rest    = match[2] ?? ''
        const url     = req.nextUrl.clone()
        url.hostname  = `${slug}.colacero.com`
        url.pathname  = rest || '/'
        return NextResponse.redirect(url, 301)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Excluir archivos estáticos y rutas internas de Next.js:
     * _next/static, _next/image, favicon.ico, y extensiones de imagen/font.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)',
  ],
}
