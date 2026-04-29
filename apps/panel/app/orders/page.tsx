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

  // ── Fetch orders ────────────────────────────────────────────────────────────
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

  // ── Auth check + initial load ────────────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) {
      router.replace('/login')
      return
    }
    tokenRef.current = token
    void fetchOrders(true)
  }, [fetchOrders, router])

  // ── Polling ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      void fetchOrders(false)
    }, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [fetchOrders])

  // ── Status action ────────────────────────────────────────────────────────────
  const handleAction = useCallback(async (orderId: string, newStatus: OrderStatus) => {
    const token = tokenRef.current
    if (!token) return

    setActionLoading(true)
    try {
      await patchOrderStatus(token, orderId, newStatus)
      // Optimistic update — replace status in local state
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
      // Re-fetch to ensure consistency
      void fetchOrders(false)
    } finally {
      setActionLoading(false)
    }
  }, [fetchOrders])

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Cargando pedidos…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-teal-700 px-4 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">📋 Pedidos del día</h1>
            {data && (
              <p className="text-sm capitalize text-teal-200">
                {formatDate(data.date)}
              </p>
            )}
          </div>
          <div className="text-right">
            {lastUpdated && (
              <p className="text-xs text-teal-300">
                Actualizado{' '}
                {lastUpdated.toLocaleTimeString('es-CU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
            <button
              onClick={() => void fetchOrders(true)}
              className="mt-1 rounded-lg bg-teal-600 px-3 py-1 text-xs font-semibold text-white hover:bg-teal-500"
            >
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {error != null && (
          <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {data == null || data.windows.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-400">No hay ventanas de recogida para hoy</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {data.windows.map((w) => (
              <WindowGroup
                key={w.id}
                window={w}
                onAction={handleAction}
                loading={actionLoading}
              />
            ))}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={() => {
            sessionStorage.removeItem('panel_token')
            router.push('/login')
          }}
          className="mt-6 w-full rounded-xl border border-gray-300 py-2 text-sm text-gray-500 hover:bg-gray-50"
        >
          Cerrar sesión
        </button>
      </div>
    </main>
  )
}
