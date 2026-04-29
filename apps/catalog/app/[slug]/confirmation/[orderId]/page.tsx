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
        className="group flex flex-col items-center gap-1"
        aria-label="Copiar código de recogida"
      >
        <span className="rounded-2xl border-2 border-teal-600 bg-teal-50 px-8 py-4 font-mono text-4xl font-bold tracking-widest text-teal-700">
          {code}
        </span>
        <span className="text-xs text-gray-400 group-hover:text-teal-600">
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
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-400">Cargando confirmación…</p>
      </main>
    )
  }

  if (error != null || order === null) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
        <p className="text-gray-500">{error ?? 'Pedido no encontrado.'}</p>
        <button
          onClick={() => router.push(`/${slug}`)}
          className="rounded-xl bg-teal-700 px-6 py-3 text-sm font-semibold text-white"
        >
          Volver al catálogo
        </button>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-teal-700 px-4 pb-8 pt-8 text-white text-center">
        <div className="mb-2 text-4xl">✅</div>
        <h1 className="text-2xl font-bold">¡Pedido confirmado!</h1>
        <p className="mt-1 text-sm text-teal-100">{order.business.name}</p>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6 flex flex-col gap-4">

        {/* Pickup code */}
        <section className="rounded-2xl bg-white p-6 shadow-sm text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Tu código de recogida
          </p>
          {order.pickupCode != null ? (
            <PickupCodeBox code={order.pickupCode} />
          ) : (
            <p className="text-gray-400">—</p>
          )}
          <p className="mt-4 text-xs text-gray-400">
            Mostrá este código cuando vayas a recoger tu pedido
          </p>
        </section>

        {/* Pickup window */}
        {order.pickupWindow != null && (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Ventana de recogida
            </p>
            <p className="font-medium capitalize text-gray-900">
              {formatDate(order.pickupWindow.date)}
            </p>
            <p className="text-sm text-gray-500">
              {order.pickupWindow.startTime} – {order.pickupWindow.endTime}
            </p>
          </section>
        )}

        {/* Items */}
        <section className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Detalle del pedido
          </p>
          <ul className="flex flex-col gap-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">
                  {item.name}{' '}
                  <span className="text-gray-400">
                    × {item.quantity} {item.unitLabel}
                  </span>
                </span>
                <span className="font-medium text-gray-900">
                  ${item.subtotal.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t pt-3 flex justify-between font-bold text-base">
            <span>Total</span>
            <span className="text-teal-700">${order.subtotal.toFixed(2)}</span>
          </div>
        </section>

        {/* CTA */}
        <button
          onClick={() => router.push(`/${slug}`)}
          className="w-full rounded-xl border border-teal-700 py-3 text-sm font-semibold text-teal-700"
        >
          Volver al catálogo
        </button>

      </div>
    </main>
  )
}
