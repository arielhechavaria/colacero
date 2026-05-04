'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { getOrders, patchOrderStatus } from '../../lib/api'
import type { DayOrders, OrderStatus } from '../../lib/api'
import { WindowGroup } from '../../components/window-group'
import { Button }   from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
  const router = useRouter()

  const [selectedDate,  setSelectedDate]  = useState(() => todayHavana())
  const [calOpen,       setCalOpen]       = useState(false)
  const [data,          setData]          = useState<DayOrders | null>(null)
  const [loading,       setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null)

  const tokenRef        = useRef<string | null>(null)
  const selectedDateRef = useRef(selectedDate)
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

  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
    void fetchOrders(true)
  }, [fetchOrders, router])

  // Re-fetch when date changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void fetchOrders(true) }, [selectedDate])

  // Polling — only on today
  useEffect(() => {
    const id = setInterval(() => {
      if (selectedDateRef.current === todayHavana()) void fetchOrders(false)
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
            orders: w.orders.map((o) => o.id === orderId ? { ...o, status: newStatus } : o),
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

  const today   = todayHavana()
  const isToday = selectedDate === today

  function goTo(date: string) { setSelectedDate(date) }

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
            <Button variant="outline" size="sm" onClick={() => void fetchOrders(true)}>
              Actualizar
            </Button>
          </div>
        </div>

        {/* Date navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="icon"
            onClick={() => goTo(offsetDate(selectedDate, -1))}
            aria-label="Día anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover open={calOpen} onOpenChange={setCalOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex-1 justify-start gap-2 font-normal">
                <CalendarIcon className="h-4 w-4 opacity-60" />
                <span className="capitalize">
                  {format(parseISO(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
                </span>
                {!isToday && (
                  <span className="ml-auto text-[10px] opacity-50">histórico</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                selected={parseISO(selectedDate)}
                onSelect={(d) => {
                  if (d) { goTo(format(d, 'yyyy-MM-dd')); setCalOpen(false) }
                }}
                disabled={(d) => d > new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost" size="icon"
            onClick={() => goTo(offsetDate(selectedDate, 1))}
            disabled={isToday}
            aria-label="Día siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isToday && (
            <Button variant="outline" size="sm" onClick={() => goTo(today)}>
              Hoy
            </Button>
          )}
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-4">
        {error != null && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: 'rgba(255,61,85,0.08)', color: 'var(--error)', border: '1px solid rgba(255,61,85,0.2)' }}>
            {error}
          </div>
        )}

        {data == null || data.windows.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <p style={{ color: 'var(--muted)' }}>
              {isToday
                ? 'No hay ventanas de recogida para hoy'
                : `No hay pedidos para el ${format(parseISO(selectedDate), "d 'de' MMMM", { locale: es })}`}
            </p>
          </div>
        ) : (
          data.windows.map((w) => (
            <WindowGroup key={w.id} window={w} onAction={handleAction} loading={actionLoading} />
          ))
        )}
      </div>
    </main>
  )
}
