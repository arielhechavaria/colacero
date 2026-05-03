'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getOrders, patchOrderStatus } from '../../lib/api'
import type { Order, OrderStatus } from '../../lib/api'

const POLL_INTERVAL_MS = 15_000

function buildQueue(orders: Order[]): Order[] {
  return orders
    .filter((o) => o.status === 'PREPARING' || o.status === 'CONFIRMED')
    .sort((a, b) => {
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

  const handleAction = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const token = tokenRef.current
    if (!token) return
    setActionLoading(true)
    try {
      await patchOrderStatus(token, orderId, newStatus)
      setQueue((prev) => buildQueue(prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)))
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
        <p style={{ color: 'var(--muted)' }}>Cargando cola…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <header
        className="sticky top-0 z-10 glass px-6 py-4"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gradient">Cola de preparación</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {queue.length === 0
                ? 'Todo al día ✓'
                : `${queue.length} pedido${queue.length > 1 ? 's' : ''} pendiente${queue.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
                {lastUpdated.toLocaleTimeString('es-CU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => void fetchQueue(true)}
              className="rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ background: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid var(--border-glow)' }}
            >
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-3">
        {error != null && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: 'rgba(255,61,85,0.08)', color: 'var(--error)', border: '1px solid rgba(255,61,85,0.2)' }}
          >
            {error}
          </div>
        )}

        {queue.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-semibold" style={{ color: 'var(--text)' }}>No hay pedidos pendientes</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Todos los pedidos están listos o entregados
            </p>
          </div>
        ) : (
          queue.map((order, idx) => {
            const mins   = waitingMinutes(order.confirmedAt)
            const urgent = mins >= 20

            const borderColor = order.status === 'PREPARING'
              ? urgent ? 'var(--error)' : 'var(--warning)'
              : 'var(--glass-border)'

            return (
              <div
                key={order.id}
                className="glass rounded-2xl p-4"
                style={{ borderColor, borderWidth: '2px' }}
              >
                {/* Position + code */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold flex-shrink-0"
                      style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p
                        className="text-xl font-bold tracking-widest"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}
                      >
                        {order.pickupCode ?? '—'}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        {order.customer.displayName ?? order.customer.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{
                        backgroundColor: order.status === 'PREPARING'
                          ? urgent ? 'rgba(255,61,85,0.12)' : 'rgba(255,176,32,0.12)'
                          : 'rgba(0,212,190,0.1)',
                        color: order.status === 'PREPARING'
                          ? urgent ? 'var(--error)' : 'var(--warning)'
                          : 'var(--primary)',
                      }}
                    >
                      {order.status === 'PREPARING' ? 'Preparando' : 'Confirmado'}
                    </span>
                    {order.confirmedAt && (
                      <p
                        className="mt-1 text-xs"
                        style={{ color: urgent ? 'var(--error)' : 'var(--muted)', fontWeight: urgent ? 700 : 400 }}
                      >
                        {mins} min esperando
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <ul
                  className="mb-3 flex flex-col gap-1 border-t pt-3"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span style={{ color: 'var(--text)' }}>
                        {item.name}
                        <span className="ml-1" style={{ color: 'var(--muted)' }}>× {item.quantity} {item.unitLabel}</span>
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
                      className="flex-1 rounded-xl py-2 text-sm font-semibold disabled:opacity-50"
                      style={{ backgroundColor: 'rgba(255,176,32,0.15)', color: 'var(--warning)' }}
                    >
                      Empezar preparación
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      disabled={actionLoading}
                      onClick={() => void handleAction(order.id, 'READY')}
                      className="flex-1 rounded-xl py-2 text-sm font-semibold disabled:opacity-50"
                      style={{ backgroundColor: 'rgba(0,214,143,0.15)', color: 'var(--success)' }}
                    >
                      Marcar listo ✓
                    </button>
                  )}
                  <button
                    disabled={actionLoading}
                    onClick={() => void handleAction(order.id, 'CANCELLED')}
                    className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
                    style={{ backgroundColor: 'rgba(255,61,85,0.1)', color: 'var(--error)' }}
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
