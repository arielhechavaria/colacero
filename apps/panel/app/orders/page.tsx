'use client'

import {useState, useEffect, useCallback, useRef} from 'react'
import {useRouter} from 'next/navigation'
import {format, parseISO, addDays} from 'date-fns'
import {es} from 'date-fns/locale'
import {CalendarIcon, ChevronLeft, ChevronRight} from 'lucide-react'
import {toast} from 'sonner'
import {getOrders, patchOrderStatus, isAuthenticatedClient} from '../../lib/api'
import type {DayOrders, OrderStatus} from '../../lib/api'
import {WindowGroup} from '../../components/window-group'
import {Skeleton} from '@/components/ui/skeleton'
import {EmptyState} from '../../components/empty-state'
import {Button} from '@/components/ui/button'
import {Popover, PopoverTrigger, PopoverContent} from '@/components/ui/popover'
import {Calendar} from '@/components/ui/calendar'

const POLL_INTERVAL_MS = 15_000

// ── Date helpers (Havana timezone) ────────────────────────────────────────────

function todayHavana(): string {
    return new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Havana'}).format(new Date())
}

function offsetDate(date: string, days: number): string {
    const d = new Date(date + 'T12:00:00')
    d.setDate(d.getDate() + days)
    return new Intl.DateTimeFormat('en-CA', {timeZone: 'America/Havana'}).format(d)
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OrdersPage() {
    const router = useRouter()

    const [selectedDate, setSelectedDate] = useState(() => todayHavana())
    const [calOpen, setCalOpen] = useState(false)
    const [data, setData] = useState<DayOrders | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

    const tokenRef = useRef<string | null>(null)
    const selectedDateRef = useRef(selectedDate)
    useEffect(() => {
        selectedDateRef.current = selectedDate
    }, [selectedDate])

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
            const msg = err instanceof Error ? err.message : 'Error al cargar pedidos'
            toast.error(msg)
            setError(msg)
        } finally {
            if (showLoader) setLoading(false)
        }
    }, [])

    useEffect(() => {
        const token = (isAuthenticatedClient() ? '1' : null)
        if (!token) {
            router.replace('/login');
            return
        }
        tokenRef.current = token
        void fetchOrders(true)
    }, [fetchOrders, router])

    // Re-fetch when date changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        void fetchOrders(true)
    }, [selectedDate])

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
                        orders: w.orders.map((o) => o.id === orderId ? {...o, status: newStatus} : o),
                    })),
                }
            })
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error al actualizar estado'
            toast.error(msg)
            setError(msg)
            void fetchOrders(false)
        } finally {
            setActionLoading(false)
        }
    }, [fetchOrders])

    const today = todayHavana()
    const isToday = selectedDate === today
    const isFuture = selectedDate > today
    const maxDate = format(addDays(new Date(), 30), 'yyyy-MM-dd')

    function goTo(date: string) {
        setSelectedDate(date)
    }

    if (loading) {
        return (
            <main className="min-h-screen">
                <div className="px-6 py-5 flex flex-col gap-4">
                    {Array.from({length: 3}).map((_, i) => (
                        <div key={i} className="bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg p-5 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <Skeleton className="h-5 w-32"/>
                                <Skeleton className="h-5 w-20"/>
                            </div>
                            {Array.from({length: 2}).map((_, j) => (
                                <div key={j} className="flex items-center gap-3 rounded-xl border border-white/[0.08] p-3">
                                    <Skeleton className="h-10 w-10 rounded-full flex-shrink-0"/>
                                    <div className="flex-1 flex flex-col gap-1.5">
                                        <Skeleton className="h-4 w-28"/>
                                        <Skeleton className="h-3 w-40"/>
                                    </div>
                                    <Skeleton className="h-8 w-20 rounded-lg"/>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </main>
        )
    }

    return (
        <main className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-10 px-6 pt-4 pb-3 border-b border-white/[0.08] bg-[#0B0F1A]">
                {/* Row 1: título + timestamp + refresh */}
                <div className="flex items-center justify-between gap-4 mb-3">
                    <h1 className="text-lg font-bold text-white">Pedidos</h1>
                    <div className="flex items-center gap-2">
                        {lastUpdated && (
                            <span className="text-xs font-mono hidden sm:inline text-slate-400">
                                {lastUpdated.toLocaleTimeString('es-CU', {hour: '2-digit', minute: '2-digit', second: '2-digit'})}
                            </span>
                        )}
                        <Button variant="outline" size="sm" onClick={() => void fetchOrders(true)}>
                            Actualizar
                        </Button>
                    </div>
                </div>

                {/* Row 2: date navigation */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost" size="icon"
                        onClick={() => goTo(offsetDate(selectedDate, -1))}
                        aria-label="Día anterior"
                    >
                        <ChevronLeft className="h-4 w-4"/>
                    </Button>

                    <Popover open={calOpen} onOpenChange={setCalOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="flex-1 justify-start gap-2 font-normal">
                                <CalendarIcon className="h-4 w-4 opacity-60"/>
                                <span className="capitalize sm:hidden truncate">
   {format(parseISO(selectedDate), "EEE d MMM", {locale: es})}
                   </span>
                                {!isToday && !isFuture && (
                                    <span className="ml-auto text-[10px] opacity-50">histórico</span>
                                )}
                                {isFuture && (
                                    <span className="ml-auto text-[10px] opacity-50">futuro</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={parseISO(selectedDate)}
                                onSelect={(d) => {
                                    if (d) {
                                        goTo(format(d, 'yyyy-MM-dd'));
                                        setCalOpen(false)
                                    }
                                }}
                                disabled={(d) => d > addDays(new Date(), 30)}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="ghost" size="icon"
                        onClick={() => goTo(offsetDate(selectedDate, 1))}
                        disabled={selectedDate >= maxDate}
                        aria-label="Día siguiente"
                    >
                        <ChevronRight className="h-4 w-4"/>
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
                    <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600 border border-red-200">
                        {error}
                    </div>
                )}

                {data == null || data.windows.length === 0 ? (
                    <EmptyState
                        icon={isToday ? '📭' : '📅'}
                        title={isToday ? 'Sin pedidos por ahora' : 'Ningún pedido este día'}
                        description={isToday
                            ? 'Cuando lleguen pedidos para hoy, los vas a ver acá actualizados cada 15 segundos.'
                            : `No hay pedidos registrados para el ${format(parseISO(selectedDate), "d 'de' MMMM", {locale: es})}.`}
                    />
                ) : (
                    data.windows.map((w) => (
                        <WindowGroup key={w.id} window={w} onAction={handleAction} loading={actionLoading}/>
                    ))
                )}
            </div>
        </main>
    )
}