'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getOrders, patchOrderStatus } from '../../lib/api'
import type { Order, OrderStatus } from '../../lib/api'

const POLL_INTERVAL_MS = 15_000

// Flatten all PREPARING + CONFIRMED orders across windows, sorted by confirmedAt
function buildQueue(orders: Order[]): Order[] {
  return orders
    .filter((o) => o.status === 'PREPARING' || o.status === 'CONFIRMED')
    .sort((a, b) => {
      // PREPARING before CONFIRMED, then by confirmedAt asc (oldest first)
      if (a.status !== b.status) return a.status === 'PREPARING' ? -1 : 1
      const ta = a.confirmedAt ?? ''
      const tb = b.confirmedAt ?? ''
      return ta.localeCompare(tb)
    })
}

function waitingMinutes(confirmedAt: string | null): number {
  if (!confirmedAt) return 0
  return Math.floor((Date.now() - new Date(confirmedAt).getTime()) / 60_000)
}

export default function QueuePage() {
  const router   = useRouter()
  const tokenRef = useRef<string | null>(null)

  const [queue,         setQueue]         = useState<Order[]>([])
  const [loading,       setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null)

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchQueue = useCallback(async (showLoader = false) => {
    const token = tokenRef.current
    if (!token) return
    if (showLoader) setLoading(true)
    try {
      const data = await getOrders(token)
      const allOrders = data.windows.flatMap((w) => w.orders)
      setQueue(buildQueue(allOrders))
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cola')
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
    void fetchQueue(true)
  }, [fetchQueue, router])

  useEffect(() => {
    const id = setInterval(() => void fetchQueue(false), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchQueue])

  // ── Action ────────────────────────────────────────────────────────────────
  const handleAction = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const token = tokenRef.current
    if (!token) return
    setActionLoading(true)
    try {
      await patchOrderStatus(token, orderId, newStatus)
      setQueue((prev) => {
        const updated = prev.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        )
        return buildQueue(updated)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
      void fetchQueue(false)
    } finally {
      setActionLoading(false)
    }
  }, [fetchQueue])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Cargando cola…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-orange-600 px-4 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">🍳 Cola de preparación</h1>
            <p className="text-sm text-orange-200">
              {queue.length === 0 ? 'Todo al día' : `${queue.length} pedido${queue.length > 1 ? 's' : ''} pendiente${queue.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {lastUpdated && (
              <p className="text-xs text-orange-300">
                {lastUpdated.toLocaleTimeString('es-CU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => void fetchQueue(true)}
                className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold hover:bg-orange-400"
              >
                Actualizar
              </button>
              <button
                onClick={() => router.push('/orders')}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-50"
              >
                ← Pedidos
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-3">

        {error != null && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {queue.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-4xl mb-3">✅</p>
            <p className="font-semibold text-gray-700">No hay pedidos pendientes</p>
            <p className="text-sm text-gray-400 mt-1">Todos los pedidos están listos o entregados</p>
          </div>
        ) : (
          queue.map((order, idx) => {
            const mins = waitingMinutes(order.confirmedAt)
            const urgent = mins >= 20

            return (
              <div
                key={order.id}
                className={`rounded-2xl border-2 bg-white p-4 shadow-sm ${
                  order.status === 'PREPARING'
                    ? urgent ? 'border-red-400' : 'border-orange-400'
                    : 'border-gray-200'
                }`}
              >
                {/* Position + code */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-mono text-xl font-bold tracking-widest text-gray-800">
                        {order.pickupCode ?? '—'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.customer.displayName ?? order.customer.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      order.status === 'PREPARING'
                        ? urgent ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status === 'PREPARING' ? 'Preparando' : 'Confirmado'}
                    </span>
                    {order.confirmedAt && (
                      <p className={`mt-1 text-xs ${urgent ? 'font-bold text-red-600' : 'text-gray-400'}`}>
                        {mins} min esperando
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <ul className="mb-3 flex flex-col gap-1 border-t pt-3">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.name}
                        <span className="ml-1 text-gray-400">× {item.quantity} {item.unitLabel}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === 'CONFIRMED' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => void handleAction(order.id, 'PREPARING')}
                      className="flex-1 rounded-xl bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                    >
                      Empezar preparación
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => void handleAction(order.id, 'READY')}
                      className="flex-1 rounded-xl bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Marcar listo ✓
                    </button>
                  )}
                  <button
                    disabled={actionLoading}
                    onClick={() => void handleAction(order.id, 'CANCELLED')}
                    className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
