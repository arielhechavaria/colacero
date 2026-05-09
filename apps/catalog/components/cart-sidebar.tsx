'use client'

import { useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { useCartContext } from '../context/cart-context'
import { reserveStock } from '../lib/client-api'

export function CartSidebar() {
  const { items, total, itemCount, removeAll, clear } = useCartContext()
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const router = useRouter()
  const params = useParams<{ slug: string }>()
  const pathname = usePathname()

  if (pathname.includes('/checkout') || pathname.includes('/confirmation')) return null

  async function handleCheckout() {
    if (items.length === 0) return
    setLoading(true)
    setError(null)
    try {
      const reservations = await Promise.all(
        items.map((item) => reserveStock(item.productId, item.quantity)),
      )
      sessionStorage.setItem(
        'colacero_reservation_ids',
        JSON.stringify(reservations.map((r) => r.reservationId)),
      )
      router.push(`/${params.slug}/checkout`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'reserve_failed'
      setError(
        msg === 'insufficient_stock'
          ? 'No hay suficiente stock para algunos productos.'
          : 'Hubo un problema al reservar. Intentá de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="hidden lg:flex flex-col h-full border-l" style={{ borderColor: 'var(--border)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-base font-bold" style={{ color: 'var(--text)' }}>Tu pedido</h2>
        {itemCount > 0 && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </p>
        )}
      </div>

      {/* Items — scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-4xl">🛒</span>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Tu carrito está vacío
            </p>
            <p className="text-xs max-w-[180px]" style={{ color: 'var(--muted)' }}>
              Agregá productos del catálogo para empezar tu pedido
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
            {items.map((item) => (
              <li key={item.productId} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug truncate" style={{ color: 'var(--text)' }}>
                    {item.name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                    {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-bold font-mono" style={{ color: 'var(--primary)' }}>
                    ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeAll(item.productId)}
                    className="text-base leading-none opacity-30 hover:opacity-80 transition-opacity"
                    style={{ color: 'var(--muted)' }}
                    aria-label={`Quitar ${item.name}`}
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer — checkout */}
      {items.length > 0 && (
        <div className="flex-shrink-0 px-6 py-5 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Total</span>
            <span className="text-xl font-black font-mono text-gradient">${total.toFixed(2)}</span>
          </div>

          {error && (
            <p className="mb-3 rounded-lg px-3 py-2 text-xs"
              style={{ backgroundColor: 'rgba(255,61,85,0.1)', color: 'var(--error)' }}>
              {error}
            </p>
          )}

          <button
            onClick={() => void handleCheckout()}
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 bg-gradient-teal-violet shadow-glow transition-opacity hover:opacity-90"
          >
            {loading ? 'Reservando…' : '✅ Confirmar pedido'}
          </button>
          <button
            onClick={() => clear()}
            disabled={loading}
            className="mt-2 w-full rounded-xl py-2 text-xs disabled:opacity-40 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--muted)' }}
          >
            Vaciar carrito
          </button>
        </div>
      )}
    </aside>
  )
}
