'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getOrders, patchOrderStatus, isAuthenticatedClient } from '../../lib/api'
import type { Order, OrderStatus } from '../../lib/api'
import { Button }   from '@/components/ui/button'
import { Badge }    from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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
    const token = (isAuthenticatedClient() ? '1' : null)
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
      <main className="min-h-screen px-6 py-8 max-w-4xl mx-auto space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <Skeleton className="h-5 w-40 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <header
        className="sticky top-0 z-10 px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gradient">Cola de preparación</h1>
            <p className="text-sm text-slate-500">
              {queue.length === 0
                ? 'Todo al día ✓'
                : `${queue.length} pedido${queue.length > 1 ? 's' : ''} pendiente${queue.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs font-mono text-slate-500">
                {lastUpdated.toLocaleTimeString('es-CU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <Button variant="outline" size="sm" onClick={() => void fetchQueue(true)}>
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-3">
        {error != null && (
          <div
            className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600 border border-red-200"
          >
            {error}
          </div>
        )}

        {queue.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-10 text-center">
            <p className="text-3xl mb-2">✅</p>
            <p className="font-semibold text-slate-900">No hay pedidos pendientes</p>
            <p className="text-sm mt-1 text-slate-500">
              Todos los pedidos están listos o entregados
            </p>
          </div>
        ) : (
          queue.map((order, idx) => {
            const mins   = waitingMinutes(order.confirmedAt)
            const urgent = mins >= 20

            const borderColor = order.status === 'PREPARING'
              ? urgent ? '#DC2626' : '#D97706'
              : '#E2E8F0'

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm p-4 border-2"
                style={{ borderColor }}
              >
                {/* Position + code */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold flex-shrink-0 bg-indigo-50 text-indigo-600"
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p
                        className="text-xl font-bold tracking-widest font-mono text-indigo-600"
                      >
                        {order.pickupCode ?? '—'}
                      </p>
                      <p className="text-sm text-slate-500">
                        {order.customer.displayName ?? order.customer.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={order.status === 'PREPARING' ? (urgent ? 'destructive' : 'warning') : 'default'}>
                      {order.status === 'PREPARING' ? 'Preparando' : 'Confirmado'}
                    </Badge>
                    {order.confirmedAt && (
                      <p
                        className={`mt-1 text-xs ${urgent ? 'text-red-600 font-bold' : 'text-slate-500'}`}
                      >
                        {mins} min esperando
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <ul
                  className="mb-3 flex flex-col gap-1 border-t border-slate-200 pt-3"
                >
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between text-sm">
                      <span className="text-slate-900">
                        {item.name}
                        <span className="ml-1 text-slate-500">× {item.quantity} {item.unitLabel}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Notas del cliente */}
                {order.notes && (
                  <p
                    className="mb-3 rounded-lg px-3 py-2 text-sm leading-snug bg-amber-50 text-amber-600 border-l-2 border-amber-400"
                  >
                    📝 {order.notes}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {order.status === 'CONFIRMED' && (
                    <Button
                      variant="warning"
                      size="sm"
                      className="flex-1"
                      disabled={actionLoading}
                      onClick={() => void handleAction(order.id, 'PREPARING')}
                    >
                      Empezar preparación
                    </Button>
                  )}
                  {order.status === 'PREPARING' && (
                    <Button
                      variant="success"
                      size="sm"
                      className="flex-1"
                      disabled={actionLoading}
                      onClick={() => void handleAction(order.id, 'READY')}
                    >
                      Marcar listo ✓
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={actionLoading}
                    onClick={() => void handleAction(order.id, 'CANCELLED')}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}
