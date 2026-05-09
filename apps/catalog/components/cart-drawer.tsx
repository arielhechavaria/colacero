'use client'

import { useState, useCallback } from 'react'
import { useRouter, useParams, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartContext } from '../context/cart-context'
import { reserveStock } from '../lib/client-api'

interface StockInfo {
  products: Array<{
    id: string
    inventory?: { quantityAvailable: number } | null
    unitLabel: string
  }>
}

export function CartDrawer() {
  const { items, total, itemCount, remove, removeAll, clear } = useCartContext()
  const pathname = usePathname()
  const [open, setOpen]       = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [stockWarnings, setStockWarnings] = useState<string[]>([])
  const router = useRouter()
  const params = useParams<{ slug: string }>()

  const syncStock = useCallback(async () => {
    if (items.length === 0) return
    try {
      const res = await fetch(`/api/catalog/${params.slug}`)
      if (!res.ok) return
      const data = await res.json() as StockInfo
      const stockMap = new Map(
        data.products.map((p) => [p.id, p.inventory?.quantityAvailable ?? 0])
      )
      const warnings: string[] = []
      for (const item of items) {
        const available = stockMap.get(item.productId)
        if (available === undefined || available === 0) {
          removeAll(item.productId)
          warnings.push(`"${item.name}" ya no está disponible`)
        } else if (available < item.quantity) {
          // Reduce quantity to available — remove until quantity matches
          for (let i = item.quantity; i > available; i--) {
            remove(item.productId)
          }
          warnings.push(`Ajustamos "${item.name}" a ${available} ${item.unitLabel}`)
        }
      }
      if (warnings.length > 0) setStockWarnings(warnings)
    } catch {
      // Fallo silencioso — no bloquear apertura del carrito
    }
  }, [items, params.slug, remove, removeAll])

  function handleOpen() {
    setOpen(true)
    setStockWarnings([])
    void syncStock()
  }

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
    /* Mobile only — hidden on lg+ (CartSidebar handles desktop) */
    <div className="lg:hidden">
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            onClick={handleOpen}
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
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
            <motion.span
              key={itemCount}
              initial={{ scale: 1.4 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="text-sm font-semibold rounded-full px-2 py-0.5 bg-white/20"
            >
              {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
            </motion.span>
            <span className="text-sm font-bold font-mono">${total.toFixed(2)}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Overlay + Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            />
            <motion.aside
              key="drawer"
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl shadow-xl glass"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
              aria-label="Carrito de compras"
            >
              <div className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold" style={{ color: 'var(--text)' }}>Tu pedido</h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-2xl leading-none"
                    style={{ color: 'var(--muted)' }}
                    aria-label="Cerrar carrito"
                  >×</button>
                </div>

                {stockWarnings.length > 0 && (
                  <ul className="mb-3 flex flex-col gap-1">
                    {stockWarnings.map((w, i) => (
                      <li key={i} className="rounded-lg px-3 py-1.5 text-xs"
                        style={{ backgroundColor: 'rgba(255,176,32,0.12)', color: 'var(--warning)' }}>
                        ⚠️ {w}
                      </li>
                    ))}
                  </ul>
                )}

                {items.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <span className="text-4xl">🛒</span>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Tu carrito está vacío</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Agregá productos del catálogo</p>
                  </div>
                ) : (
                  <>
                    <ul className="flex flex-col gap-3">
                      {items.map((item) => (
                        <li key={item.productId} className="flex items-center justify-between border-b pb-3"
                          style={{ borderColor: 'var(--border)' }}>
                          <div>
                            <p className="font-medium leading-snug" style={{ color: 'var(--text)' }}>{item.name}</p>
                            <p className="text-sm" style={{ color: 'var(--muted)' }}>
                              {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold font-mono" style={{ color: 'var(--primary)' }}>
                              ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeAll(item.productId)}
                              className="text-lg leading-none opacity-40 hover:opacity-100 transition-opacity"
                              style={{ color: 'var(--muted)' }}
                              aria-label={`Quitar ${item.name}`}
                            >✕</button>
                          </div>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 pt-4 flex items-center justify-between text-lg font-bold">
                      <span style={{ color: 'var(--text)' }}>Total</span>
                      <span className="font-mono text-gradient">${total.toFixed(2)}</span>
                    </div>

                    {error != null && (
                      <p className="mt-3 rounded-lg px-3 py-2 text-sm"
                        style={{ backgroundColor: 'rgba(255,61,85,0.1)', color: 'var(--error)' }}>
                        {error}
                      </p>
                    )}

                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={() => { clear(); setOpen(false) }}
                        disabled={loading}
                        className="flex-1 rounded-xl border py-3 text-sm disabled:opacity-40"
                        style={{ borderColor: 'var(--glass-border)', color: 'var(--muted)', backgroundColor: 'transparent' }}
                      >Vaciar</button>
                      <button
                        onClick={() => void handleCheckout()}
                        disabled={loading}
                        className="flex-[2] rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 bg-gradient-teal-violet shadow-glow"
                      >{loading ? 'Reservando…' : 'Confirmar pedido'}</button>
                    </div>
                  </>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
