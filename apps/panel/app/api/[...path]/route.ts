/**
 * Proxy runtime hacia la API de Fastify.
 * Lee API_URL en cada request (runtime), no en build time.
 * Browser llama a /api/* → este handler lo reenvía a http://api:3000/api/*
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
    const ct = req.headers.get('content-type')
    if (ct) headers.set('content-type', ct)
    const auth = req.headers.get('authorization')
    if (auth) headers.set('authorization', auth)
    // Forward cookies (cc_access, cc_refresh, cc_csrf) and CSRF header upstream
    const cookie = req.headers.get('cookie')
    if (cookie) headers.set('cookie', cookie)
    const csrf = req.headers.get('x-csrf-token')
    if (csrf) headers.set('x-csrf-token', csrf)

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

    // Forward Set-Cookie headers back to the browser so auth cookies are stored
    const responseHeaders = new Headers()
    responseHeaders.set('content-type', res.headers.get('content-type') ?? 'application/json')
    for (const cookie of res.headers.getSetCookie()) {
      responseHeaders.append('set-cookie', cookie)
    }

    return new NextResponse(resBody, {
      status: res.status,
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
