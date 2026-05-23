/**
 * Proxy runtime hacia la API de Fastify.
 * Lee API_URL en cada request (runtime), no en build time.
 * Browser llama a /api/* → este handler lo reenvía a http://api:3000/api/*
 *
 * Headers críticos que se forwarden:
 *   - cookie        → cc_csrf + cc_access para auth y CSRF validation
 *   - x-csrf-token  → double-submit CSRF token
 *   Set-Cookie de la respuesta se forwarda íntegro para que el browser reciba las auth cookies.
 */
import { type NextRequest, NextResponse } from 'next/server'

const API_URL = process.env.API_URL ?? 'http://localhost:3000'

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params
    const upstream = `${API_URL}/api/${path.join('/')}${req.nextUrl.search}`

    const headers = new Headers()

    const ct     = req.headers.get('content-type')
    const auth   = req.headers.get('authorization')
    const cookie = req.headers.get('cookie')         // cc_csrf + cc_access (CSRF + JWT auth)
    const csrf   = req.headers.get('x-csrf-token')   // double-submit CSRF token
    const realIp = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')

    if (ct)     headers.set('content-type',  ct)
    if (auth)   headers.set('authorization', auth)
    if (cookie) headers.set('cookie',        cookie)
    if (csrf)   headers.set('x-csrf-token',  csrf)
    if (realIp) headers.set('x-real-ip',     realIp)

    const body: string | null =
      req.method !== 'GET' && req.method !== 'HEAD'
        ? await req.text()
        : null

    const res = await fetch(upstream, {
      method: req.method,
      headers,
      body,
    })

    const resBody = await res.text()

    // Construir response headers — forwardear Set-Cookie es crítico para que el browser
    // reciba cc_access, cc_refresh y cc_csrf después del login/auth.
    const responseHeaders = new Headers()
    responseHeaders.set('content-type', res.headers.get('content-type') ?? 'application/json')

    // getSetCookie() devuelve un array con todos los Set-Cookie headers por separado
    // (es el único header HTTP donde pueden aparecer múltiples valores distintos).
    const setCookies: string[] =
      typeof res.headers.getSetCookie === 'function'
        ? res.headers.getSetCookie()
        : res.headers.get('set-cookie')
          ? [res.headers.get('set-cookie')!]
          : []

    for (const c of setCookies) {
      responseHeaders.append('set-cookie', c)
    }

    return new NextResponse(resBody, {
      status:  res.status,
      headers: responseHeaders,
    })
  } catch (err) {
    console.error('[proxy] error:', err)
    return NextResponse.json({ error: 'proxy_error', detail: String(err) }, { status: 502 })
  }
}

export const GET    = handler
export const POST   = handler
export const PUT    = handler
export const PATCH  = handler
export const DELETE = handler
