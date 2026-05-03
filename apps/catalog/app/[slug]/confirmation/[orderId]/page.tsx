'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getOrder, type OrderDetail } from '../../../../lib/client-api'

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('es-CU', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
}

function PickupCodeBox({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => void handleCopy()}
        className="group flex flex-col items-center gap-2"
        aria-label="Copiar código de recogida"
      >
        <span
          className="rounded-2xl px-8 py-4 text-6xl font-black tracking-widest font-mono text-gradient animate-glow"
          style={{ letterSpacing: '0.15em' }}
        >
          {code}
        </span>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          {copied ? '✓ Copiado' : 'Toca para copiar'}
        </span>
      </button>
    </div>
  )
}

export default function ConfirmationPage() {
  const router  = useRouter()
  const { slug, orderId } = useParams<{ slug: string; orderId: string }>()

  const [order, setOrder]     = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchOrder = useCallback(async () => {
    const token = sessionStorage.getItem('colacero_token')
    if (!token) {
      router.replace(`/${slug}`)
      return
    }
    try {
      const data = await getOrder(orderId, token)
      setOrder(data)
    } catch {
      setError('No pudimos cargar los detalles del pedido.')
    } finally {
      setLoading(false)
    }
  }, [orderId, router, slug])

  useEffect(() => {
    void fetchOrder()
  }, [fetchOrder])

  if (loading) {
    return (
      <main
        className="flex min-h-screen items-center justify-center"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <p style={{ color: 'var(--muted)' }}>Cargando confirmación…</p>
      </main>
    )
  }

  if (error != null || order === null) {
    return (
      <main
        className="flex min-h-screen flex-col items-center justify-center gap-4 px-4"
        style={{ backgroundColor: 'var(--bg)' }}
      >
        <p style={{ color: 'var(--muted)' }}>{error ?? 'Pedido no encontrado.'}</p>
        <button
          onClick={() => router.push(`/${slug}`)}
          className="rounded-xl px-6 py-3 text-sm font-semibold"
          style={{ backgroundColor: 'var(--primary)', color: 'var(--sidebar)' }}
        >
          Volver al catálogo
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Header glass */}
      <header
        className="glass px-4 pb-8 pt-8 text-center"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="mb-2 text-4xl">✅</div>
        <h1 className="text-2xl font-black text-gradient">
          ¡Pedido confirmado!
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
          {order.business.name}
        </p>
      </header>

      <div
        className="mx-auto max-w-lg px-4 py-6 flex flex-col gap-4"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >

        {/* Pickup code — glass card destacada */}
        <section className="glass rounded-2xl p-6 text-center">
          <p
            className="mb-4 text-sm font-semibold uppercase tracking-wide"
            style={{ color: 'var(--muted)' }}
          >
            Tu código de recogida
          </p>
          {order.pickupCode != null ? (
            <PickupCodeBox code={order.pickupCode} />
          ) : (
            <p style={{ color: 'var(--muted)' }}>—</p>
          )}
          <p className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>
            Mostrá este código cuando vayas a recoger tu pedido
          </p>
        </section>

        {/* Pickup window */}
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

        {/* Items */}
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
                  {item.name}{' '}
                  <span style={{ color: 'var(--muted)' }}>
                    × {item.quantity} {item.unitLabel}
                  </span>
                </span>
                <span className="font-medium" style={{ color: 'var(--text)' }}>
                  ${item.subtotal.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div
            className="mt-3 border-t pt-3 flex justify-between font-bold text-base"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <span style={{ color: 'var(--text)' }}>Total</span>
            <span className="font-mono text-gradient">
              ${order.subtotal.toFixed(2)}
            </span>
          </div>
        </section>

        {/* CTA gradiente */}
        <button
          onClick={() => router.push(`/${slug}`)}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white bg-gradient-teal-violet shadow-glow"
        >
          Volver al catálogo
        </button>

      </div>
    </main>
  )
}
