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
  const { path } = await params
  const upstream = `${API_URL}/api/${path.join('/')}${req.nextUrl.search}`

  const headers = new Headers(req.headers)
  headers.delete('host')

  const body =
    req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined

  const res = await fetch(upstream, {
    method:  req.method,
    headers,
    body,
    // @ts-expect-error — duplex requerido por Node cuando body es stream
    duplex: 'half',
  })

  return new NextResponse(res.body, {
    status:  res.status,
    headers: res.headers,
  })
}

export const GET    = handler
export const POST   = handler
export const PUT    = handler
export const PATCH  = handler
export const DELETE = handler
