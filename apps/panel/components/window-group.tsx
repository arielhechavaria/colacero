'use client'

import { motion, AnimatePresence, type Variants } from 'framer-motion'
import type { PickupWindowGroup, Order, OrderStatus } from '../lib/api'
import { OrderCard } from './order-card'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'

// ── Variants ──────────────────────────────────────────────────────────────────

const colVariants: Variants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.07 } },
}

const cardVariants: Variants = {
    hidden:  { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
}

interface Props {
    window:   PickupWindowGroup
    onAction: (orderId: string, newStatus: OrderStatus) => Promise<void>
    loading:  boolean
}

const COLUMNS: {
    key:      string
    label:    string
    statuses: OrderStatus[]
    dotClass: string
    textClass: string
    bgClass:  string
    borderClass: string
}[] = [
    { key: 'pending',   label: 'Por preparar', statuses: ['CONFIRMED'],           dotClass: 'bg-amber-400',   textClass: 'text-amber-700',   bgClass: 'bg-amber-50',   borderClass: 'border-amber-100' },
    { key: 'preparing', label: 'Preparando',   statuses: ['PREPARING'],           dotClass: 'bg-indigo-500',  textClass: 'text-indigo-700',  bgClass: 'bg-indigo-50',  borderClass: 'border-indigo-100' },
    { key: 'ready',     label: 'Listos',       statuses: ['READY', 'PICKED_UP'],  dotClass: 'bg-emerald-500', textClass: 'text-emerald-700', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-100' },
]

// ── Mobile: acción primaria según status ──────────────────────────────────────

function MobileActionButton({ order, onAction, loading }: {
    order: Order; onAction: (orderId: string, newStatus: OrderStatus) => Promise<void>; loading: boolean
}) {
    if (order.status === 'CONFIRMED') return (
        <Button variant="warning" size="sm" disabled={loading} onClick={() => void onAction(order.id, 'PREPARING')} className="text-xs">
            Preparar
        </Button>
    )
    if (order.status === 'PREPARING') return (
        <Button variant="success" size="sm" disabled={loading} onClick={() => void onAction(order.id, 'READY')} className="text-xs">
            Listo ✓
        </Button>
    )
    if (order.status === 'READY') return (
        <Button size="sm" disabled={loading} onClick={() => void onAction(order.id, 'PICKED_UP')} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
            Entregar
        </Button>
    )
    return null
}

function MobileStatusBadge({ status }: { status: OrderStatus }) {
    const map: Partial<Record<OrderStatus, { variant: 'warning' | 'default' | 'success'; label: string }>> = {
        CONFIRMED: { variant: 'warning', label: 'Por prep.'  },
        PREPARING: { variant: 'default', label: 'Preparando' },
        READY:     { variant: 'success', label: 'Listo'      },
    }
    const info = map[status]
    if (!info) return null
    return <Badge variant={info.variant}>{info.label}</Badge>
}

function MobileOrderRow({ order, onAction, loading }: {
    order: Order; onAction: (orderId: string, newStatus: OrderStatus) => Promise<void>; loading: boolean
}) {
    const isDone = order.status === 'PICKED_UP' || order.status === 'CANCELLED' || order.status === 'EXPIRED'
    if (isDone) return null

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-indigo-600 tracking-wide">
                        {order.pickupCode ?? '—'}
                    </span>
                    <MobileStatusBadge status={order.status} />
                </div>
                <p className="text-xs mt-0.5 truncate text-slate-500">
                    {order.customer.displayName ?? order.customer.phone}
                </p>
                <p className="text-[11px] mt-0.5 truncate text-slate-500">
                    {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                </p>
                {order.notes && (
                    <p className="text-[11px] mt-1 text-amber-600">
                        📝 {order.notes}
                    </p>
                )}
            </div>
            <div className="flex-shrink-0">
                <MobileActionButton order={order} onAction={onAction} loading={loading} />
            </div>
        </div>
    )
}

// ── WindowGroup ───────────────────────────────────────────────────────────────

export function WindowGroup({ window: w, onAction, loading }: Props) {
    const activeOrders = w.orders.filter(
        (o) => o.status !== 'CANCELLED' && o.status !== 'EXPIRED' && o.status !== 'DRAFT',
    )
    const occupancy = w.capacity > 0 ? Math.round((activeOrders.length / w.capacity) * 100) : 0

    const pendingCount   = activeOrders.filter(o => o.status === 'CONFIRMED').length
    const preparingCount = activeOrders.filter(o => o.status === 'PREPARING').length
    const readyCount     = activeOrders.filter(o => o.status === 'READY' || o.status === 'PICKED_UP').length

    return (
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Window header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <div className="flex items-center gap-3 flex-wrap">
                    <span className="rounded-lg px-2.5 py-1 text-xs font-semibold font-mono bg-indigo-50 text-indigo-600 border border-indigo-100">
                        {w.startTime} – {w.endTime}
                    </span>
                    <span className="text-sm text-slate-500">
                        {activeOrders.length}/{w.capacity} cupos
                    </span>
                    <div className="flex gap-1.5 lg:hidden">
                        {pendingCount   > 0 && <Badge variant="warning">{pendingCount} por prep.</Badge>}
                        {preparingCount > 0 && <Badge variant="default">{preparingCount} prep.</Badge>}
                        {readyCount     > 0 && <Badge variant="success">{readyCount} listos</Badge>}
                    </div>
                </div>

                {/* Occupancy bar — solo desktop */}
                <div className="hidden lg:flex items-center gap-2">
                    <div className="h-1.5 w-24 rounded-full overflow-hidden bg-slate-100">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width:           `${Math.min(occupancy, 100)}%`,
                                backgroundColor: occupancy > 80 ? '#DC2626' : '#6366F1',
                            }}
                        />
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">{occupancy}%</span>
                </div>
            </div>

            {/* MOBILE: lista vertical */}
            <div className="lg:hidden">
                {activeOrders.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">Sin pedidos activos</p>
                ) : (
                    <div className="flex flex-col gap-2 p-3">
                        {activeOrders.map((order) => (
                            <MobileOrderRow key={order.id} order={order} onAction={onAction} loading={loading} />
                        ))}
                    </div>
                )}
            </div>

            {/* DESKTOP: kanban 3 columnas */}
            <div className="hidden lg:block overflow-x-auto">
                <div className="grid grid-cols-3 min-w-[480px]">
                    {COLUMNS.map((col, i) => {
                        const colOrders = activeOrders.filter((o) => col.statuses.includes(o.status))
                        return (
                            <div
                                key={col.key}
                                className={`flex flex-col ${i > 0 ? 'border-l border-slate-100' : ''}`}
                            >
                                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                                    <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${col.dotClass}`} />
                                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${col.textClass}`}>
                                        {col.label}
                                    </span>
                                    {colOrders.length > 0 && (
                                        <span className={`ml-auto text-[10px] font-semibold font-mono rounded-full px-1.5 py-0.5 ${col.bgClass} ${col.textClass} border ${col.borderClass}`}>
                                            {colOrders.length}
                                        </span>
                                    )}
                                </div>
                                <motion.div
                                    className="flex flex-col gap-2 p-2 min-h-[80px]"
                                    variants={colVariants}
                                    initial="hidden"
                                    animate="visible"
                                >
                                    {colOrders.length === 0 ? (
                                        <p className="py-4 text-center text-xs text-slate-300">—</p>
                                    ) : (
                                        <AnimatePresence initial={false}>
                                        {colOrders.map((order) => (
                                            <motion.div
                                                key={order.id}
                                                variants={cardVariants}
                                                exit={{ opacity: 0, scale: 0.9, x: 10 }}
                                                layout
                                            >
                                                <OrderCard order={order} onAction={onAction} loading={loading} />
                                            </motion.div>
                                        ))}
                                        </AnimatePresence>
                                    )}
                                </motion.div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
