'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getOrders, patchOrderStatus } from '../../lib/api'
import type { DayOrders, OrderStatus } from '../../lib/api'
import { WindowGroup } from '../../components/window-group'

const POLL_INTERVAL_MS = 15_000

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CU', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
}

export default function OrdersPage() {
  const router = useRouter()

  const [data,          setData]          = useState<DayOrders | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null)

  const tokenRef = useRef<string | null>(null)

  const fetchOrders = useCallback(async (showLoader = false) => {
    const token = tokenRef.current
    if (!token) return
    if (showLoader) setLoading(true)
    try {
      const result = await getOrders(token)
      setData(result)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
    void fetchOrders(true)
  }, [fetchOrders, router])

  useEffect(() => {
    const id = setInterval(() => void fetchOrders(false), POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchOrders])

  const handleAction = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const token = tokenRef.current
    if (!token) return
    setActionLoading(true)
    try {
      await patchOrderStatus(token, orderId, newStatus)
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          windows: prev.windows.map((w) => ({
            ...w,
            orders: w.orders.map((o) =>
              o.id === orderId ? { ...o, status: newStatus } : o
            ),
          })),
        }
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado')
      void fetchOrders(false)
    } finally {
      setActionLoading(false)
    }
  }, [fetchOrders])

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p style={{ color: 'var(--muted)' }}>Cargando pedidos…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-6 py-4"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
            >
              Pedidos del día
            </h1>
            {data && (
              <p className="text-sm capitalize" style={{ color: 'var(--muted)' }}>
                {formatDate(data.date)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                {lastUpdated.toLocaleTimeString('es-CU', {
                  hour:   '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            )}
            <button
              onClick={() => void fetchOrders(true)}
              className="rounded-xl px-4 py-2 text-sm font-semibold transition-all"
              style={{
                backgroundColor: 'var(--primary-dim)',
                color:           'var(--primary)',
                border:          '1px solid var(--border-glow)',
              }}
            >
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-4">
        {error != null && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              backgroundColor: 'rgba(255,61,85,0.08)',
              color:           'var(--error)',
              border:          '1px solid rgba(255,61,85,0.2)',
            }}
          >
            {error}
          </div>
        )}

        {data == null || data.windows.length === 0 ? (
          <div
            className="rounded-2xl p-10 text-center border"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <p style={{ color: 'var(--muted)' }}>No hay ventanas de recogida para hoy</p>
          </div>
        ) : (
          data.windows.map((w) => (
            <WindowGroup
              key={w.id}
              window={w}
              onAction={handleAction}
              loading={actionLoading}
            />
          ))
        )}
      </div>
    </main>
  )
}
