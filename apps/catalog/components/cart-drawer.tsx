'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useCartContext } from '../context/cart-context'
import { reserveStock } from '../lib/client-api'

export function CartDrawer() {
  const { items, total, itemCount, remove, clear } = useCartContext()
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

  return (
    <>
      {/* FAB — botón flotante del carrito */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-4 flex items-center gap-2 rounded-full bg-teal-700 px-4 py-3 text-white shadow-lg"
        aria-label="Ver carrito"
      >
        <span className="text-xl">🛒</span>
        {itemCount > 0 && (
          <span className="text-sm font-semibold">{itemCount}</span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-xl transition-transform duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        aria-label="Carrito de compras"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Tu pedido</h2>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-400 text-2xl leading-none"
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-gray-400">El carrito está vacío</p>
        ) : (
          <>
            <ul className="flex flex-col gap-3">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium leading-snug">{item.name}</p>
                    <p className="text-sm text-gray-400">
                      {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold text-teal-700">
                    ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t pt-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-teal-700">${total.toFixed(2)}</span>
              </div>
            </div>

            {error != null && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { clear(); setOpen(false) }}
                disabled={loading}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm text-gray-600 disabled:opacity-40"
              >
                Vaciar
              </button>
              <button
                onClick={() => void handleCheckout()}
                disabled={loading}
                className="flex-[2] rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {loading ? 'Reservando…' : 'Confirmar pedido'}
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
