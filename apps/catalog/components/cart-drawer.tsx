'use client'

import { useState } from 'react'
import { useCartContext } from '../context/cart-context'

export function CartDrawer() {
  const { items, total, itemCount, remove, clear } = useCartContext()
  const [open, setOpen] = useState(false)

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

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => { clear(); setOpen(false) }}
                className="flex-1 rounded-xl border border-gray-300 py-3 text-sm text-gray-600"
              >
                Vaciar
              </button>
              <button className="flex-[2] rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white">
                Confirmar pedido
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
