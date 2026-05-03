'use client'

import { useState } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { useCartContext } from '../context/cart-context'
import { reserveStock } from '../lib/client-api'

export function CartDrawer() {
  const { items, total, itemCount, remove, clear } = useCartContext()
  const pathname = usePathname()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const router = useRouter()
  const params = useParams<{ slug: string }>()

  async function handleCheckout() {
    if (items.length === 0) return
    setLoading(true)
    setError(null)

    try {
      // Reservar stock para todos los items del carrito
      const reservations = await Promise.all(
        items.map((item) => reserveStock(item.productId, item.quantity)),
      )
      const reservationIds = reservations.map((r) => r.reservationId)

      // Guardar en sessionStorage para que la página de checkout lo lea
      sessionStorage.setItem('colacero_reservation_ids', JSON.stringify(reservationIds))

      router.push(`/${params.slug}/checkout`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'reserve_failed'
      setError(
        msg === 'insufficient_stock'
          ? 'No hay suficiente stock para algunos productos. Revisá el carrito.'
          : 'Hubo un problema al reservar. Intentá de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  // No mostrar en checkout/confirmation
  if (pathname.includes('/checkout') || pathname.includes('/confirmation')) {
    return null
  }

  // No mostrar FAB si el carrito está vacío
  if (itemCount === 0 && !open) {
    return null
  }

  return (
    <>
      {/* FAB — botón flotante gradiente */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed z-30 flex items-center gap-2.5 rounded-2xl px-4 py-3.5 bg-gradient-teal-violet shadow-glow text-white"
          style={{
            bottom:    'calc(1.5rem + env(safe-area-inset-bottom))',
            left:      '50%',
            transform: 'translateX(-50%)',
            maxWidth:  'calc(100vw - 32px)',
            whiteSpace:'nowrap',
          }}
          aria-label="Ver carrito"
        >
          <span className="text-lg">🛒</span>
          <span className="text-sm font-semibold rounded-full px-2 py-0.5 bg-white/20">
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </span>
          <span className="text-sm font-bold font-mono">
            ${total.toFixed(2)}
          </span>
        </button>
      )}

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer glass */}
      <aside
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl shadow-xl transition-transform duration-300 glass ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Carrito de compras"
      >
      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
            Tu pedido
          </h2>
          <button
            onClick={() => setOpen(false)}
            className="text-2xl leading-none"
            style={{ color: 'var(--muted)' }}
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center" style={{ color: 'var(--muted)' }}>
            El carrito está vacío
          </p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li
                  key={item.productId}
                  className="flex items-center justify-between border-b pb-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <div>
                    <p className="font-medium leading-snug" style={{ color: 'var(--text)' }}>
                      {item.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>
                      {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold font-mono" style={{ color: 'var(--primary)' }}>
                    ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span style={{ color: 'var(--text)' }}>Total</span>
                <span className="font-mono" style={{ color: 'var(--primary)' }}>
                  ${total.toFixed(2)}
                </span>
              </div>
            </div>

            {error != null && (
              <p
                className="mt-3 rounded-lg px-3 py-2 text-sm"
                style={{ backgroundColor: 'rgba(255,61,85,0.1)', color: 'var(--error)' }}
              >
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { clear(); setOpen(false) }}
                disabled={loading}
                className="flex-1 rounded-xl border py-3 text-sm disabled:opacity-40 transition-colors"
                style={{ borderColor: 'var(--glass-border)', color: 'var(--muted)', backgroundColor: 'transparent' }}
              >
                Vaciar
              </button>
              <button
                onClick={() => void handleCheckout()}
                disabled={loading}
                className="flex-[2] rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 bg-gradient-teal-violet shadow-glow"
              >
                {loading ? 'Reservando…' : 'Confirmar pedido'}
              </button>
            </div>
          </>
        )}
      </div>
      </aside>
    </>
  )
}
