'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getOrderByCode, type TrackingOrder } from '../../../../lib/client-api'
import { Badge }  from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const POLL_INTERVAL_MS  = 30_000
const TERMINAL_STATUSES = new Set(['PICKED_UP', 'CANCELLED', 'EXPIRED'])

const STATUS_CONFIG: Record<string, {
  emoji: string
  label: string
  hint?: string
  color: string
  bg:    string
}> = {
  CONFIRMED: {
    emoji: '🕐',
    label: 'Confirmado',
    hint:  'Tu pedido fue recibido. Pronto comenzamos la preparación.',
    color: 'var(--warning)',
    bg:    'rgba(255,176,32,0.1)',
  },
  PREPARING: {
    emoji: '👨‍🍳',
    label: 'En preparación',
    hint:  'Ya estamos armando tu pedido.',
    color: 'var(--primary)',
    bg:    'var(--primary-dim)',
  },
  READY: {
    emoji: '✅',
    label: '¡Listo para retirar!',
    hint:  'Acercate al local con tu código de recogida.',
    color: 'var(--success)',
    bg:    'rgba(0,214,143,0.12)',
  },
  PICKED_UP: {
    emoji: '🎉',
    label: 'Retirado',
    hint:  '¡Hasta la próxima!',
    color: 'var(--muted)',
    bg:    'rgba(100,100,100,0.08)',
  },
  CANCELLED: {
    emoji: '❌',
    label: 'Cancelado',
    color: 'var(--error)',
    bg:    'rgba(255,61,85,0.1)',
  },
  EXPIRED: {
    emoji: '⏰',
    label: 'Expirado',
    color: 'var(--muted)',
    bg:    'rgba(100,100,100,0.08)',
  },
}

function formatDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-CU', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
}

export default function TrackPage() {
  const { slug, pickupCode } = useParams<{ slug: string; pickupCode: string }>()

  const [order,   setOrder]   = useState<TrackingOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)
  const terminal = useRef(false)

  const poll = useCallback(async () => {
    if (terminal.current) return
    try {
      const data = await getOrderByCode(slug, pickupCode)
      setOrder(data)
      setError(null)
      if (TERMINAL_STATUSES.has(data.status)) terminal.current = true
    } catch {
      setError('No pudimos encontrar este pedido.')
    } finally {
      setLoading(false)
    }
  }, [slug, pickupCode])

  useEffect(() => { void poll() }, [poll])

  useEffect(() => {
    const id = setInterval(() => void poll(), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [poll])

  // ── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p style={{ color: 'var(--muted)' }}>Buscando pedido…</p>
      </main>
    )
  }

  // ── Not found ──────────────────────────────────────────────────────────────

  if (error != null || order === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-5xl">🔍</p>
        <p className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Pedido no encontrado
        </p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Revisá el código e intentá de nuevo.
        </p>
        <Button asChild className="bg-gradient-teal-violet shadow-glow hover:opacity-90">
          <Link href={`/${slug}`}>Volver al catálogo</Link>
        </Button>
      </main>
    )
  }

  // ── Tracking ───────────────────────────────────────────────────────────────

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['CONFIRMED']

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header
        className="glass px-4 pb-8 pt-8 text-center"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="mb-2 text-5xl">{cfg.emoji}</div>
        <h1 className="text-2xl font-black text-gradient">{cfg.label}</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          {order.business.name}
        </p>
        {!terminal.current && (
          <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
            Se actualiza automáticamente cada 30 s
          </p>
        )}
      </header>

      <div
        className="mx-auto max-w-lg px-4 py-6 flex flex-col gap-4"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >

        {/* Estado con hint */}
        <section
          className="glass rounded-2xl p-4"
          style={{ borderColor: cfg.color, borderWidth: '2px' }}
        >
          <div className="flex items-center gap-3">
            <Badge
              variant={
                order.status === 'READY'     ? 'success'     :
                order.status === 'CANCELLED' ? 'destructive' :
                order.status === 'CONFIRMED' ? 'warning'     :
                'default'
              }
              className="text-sm px-3 py-1.5"
            >
              {cfg.label}
            </Badge>
          </div>
          {cfg.hint && (
            <p className="mt-2 text-sm" style={{ color: 'var(--text)' }}>
              {cfg.hint}
            </p>
          )}
        </section>

        {/* Código de recogida */}
        <section className="glass rounded-2xl p-6 text-center">
          <p
            className="mb-3 text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--muted)' }}
          >
            Código de recogida
          </p>
          <span
            className="text-5xl font-black tracking-widest font-mono text-gradient"
            style={{ letterSpacing: '0.15em' }}
          >
            {order.pickupCode ?? '—'}
          </span>
        </section>

        {/* Ventana de recogida */}
        {order.pickupWindow != null && (
          <section className="glass rounded-2xl p-4">
            <p
              className="mb-2 text-sm font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted)' }}
            >
              Ventana de recogida
            </p>
            <p className="font-medium capitalize" style={{ color: 'var(--text)' }}>
              {formatDate(order.pickupWindow.date)}
            </p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {order.pickupWindow.startTime} – {order.pickupWindow.endTime}
            </p>
          </section>
        )}

        {/* Notas del pedido */}
        {order.notes && (
          <section
            className="glass rounded-2xl px-4 py-3 text-sm leading-snug"
            style={{ borderLeft: '3px solid var(--warning)', color: 'var(--warning)' }}
          >
            📝 {order.notes}
          </section>
        )}

        {/* Detalle del pedido */}
        <section className="glass rounded-2xl p-4">
          <p
            className="mb-3 text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--muted)' }}
          >
            Detalle del pedido
          </p>
          <ul className="flex flex-col gap-2">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between text-sm border-b pb-2 last:border-0 last:pb-0"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                <span style={{ color: 'var(--text)' }}>
                  {item.name}
                  <span className="ml-1" style={{ color: 'var(--muted)' }}>
                    × {item.quantity} {item.unitLabel}
                  </span>
                </span>
                <span className="font-mono font-medium" style={{ color: 'var(--text)' }}>
                  ${item.subtotal.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div
            className="mt-3 border-t pt-3 flex justify-between font-bold"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <span style={{ color: 'var(--text)' }}>Total</span>
            <span className="font-mono text-gradient">${order.subtotal.toFixed(2)}</span>
          </div>
        </section>

        <Button asChild className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90">
          <Link href={`/${slug}`}>Volver al catálogo</Link>
        </Button>

      </div>
    </main>
  )
}
