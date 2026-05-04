'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getOrders, patchOrderStatus } from '../../lib/api'
import type { DayOrders, OrderStatus } from '../../lib/api'
import { WindowGroup } from '../../components/window-group'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'

const POLL_INTERVAL_MS = 15_000

// ── Date helpers (Havana timezone) ────────────────────────────────────────────

function todayHavana(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Havana' }).format(new Date())
}

function offsetDate(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Havana' }).format(d)
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CU', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter()

  const [selectedDate,   setSelectedDate]   = useState(() => todayHavana())
  const [data,           setData]           = useState<DayOrders | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [actionLoading,  setActionLoading]  = useState(false)
  const [error,          setError]          = useState<string | null>(null)
  const [lastUpdated,    setLastUpdated]    = useState<Date | null>(null)

  const tokenRef       = useRef<string | null>(null)
  const selectedDateRef = useRef(selectedDate)

  // Keep ref in sync so the polling closure always reads the latest date
  useEffect(() => { selectedDateRef.current = selectedDate }, [selectedDate])

  const fetchOrders = useCallback(async (showLoader = false) => {
    const token = tokenRef.current
    if (!token) return
    if (showLoader) setLoading(true)
    try {
      const result = await getOrders(token, selectedDateRef.current)
      setData(result)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pedidos')
    } finally {
      if (showLoader) setLoading(false)
    }
  }, [])

  // Initial auth check
  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
    void fetchOrders(true)
  }, [fetchOrders, router])

  // Re-fetch when date changes
  useEffect(() => {
    void fetchOrders(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  // Polling (only active on today — historical dates don't need live updates)
  useEffect(() => {
    const id = setInterval(() => {
      if (selectedDateRef.current === todayHavana()) {
        void fetchOrders(false)
      }
    }, POLL_INTERVAL_MS)
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

  // ── Date navigation helpers ──────────────────────────────────────────────

  const today    = todayHavana()
  const isToday  = selectedDate === today

  function goTo(date: string) {
    setSelectedDate(date)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p style={{ color: 'var(--muted)' }}>Cargando pedidos…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 glass px-6 py-4" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gradient">Pedidos</h1>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs font-mono hidden sm:inline" style={{ color: 'var(--muted)' }}>
                {lastUpdated.toLocaleTimeString('es-CU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchOrders(true)}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => goTo(offsetDate(selectedDate, -1))}
            aria-label="Día anterior"
            className="h-9 w-9 flex-shrink-0"
          >
            ←
          </Button>

          <Input
            type="date"
            value={selectedDate}
            max={today}
            onChange={(e) => { if (e.target.value) goTo(e.target.value) }}
            className="flex-1 text-center font-mono text-sm cursor-pointer"
          />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => goTo(offsetDate(selectedDate, 1))}
            disabled={isToday}
            aria-label="Día siguiente"
            className="h-9 w-9 flex-shrink-0"
          >
            →
          </Button>

          {!isToday && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => goTo(today)}
              className="flex-shrink-0"
            >
              Hoy
            </Button>
          )}
        </div>

        {data && (
          <p className="text-xs capitalize mt-1.5" style={{ color: 'var(--muted)' }}>
            {formatDate(selectedDate)}
            {!isToday && <span className="ml-2 opacity-60">(histórico)</span>}
          </p>
        )}
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
          <div className="glass rounded-2xl p-10 text-center">
            <p style={{ color: 'var(--muted)' }}>
              {isToday
                ? 'No hay ventanas de recogida para hoy'
                : `No hay pedidos para el ${formatDate(selectedDate)}`}
            </p>
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
