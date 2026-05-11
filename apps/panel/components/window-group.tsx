'use client'

/**
 * PATCH: apps/panel/components/window-group.tsx
 *
 * PROBLEMA: Kanban 3 columnas con min-w-[480px] fuerza scroll horizontal.
 *           OrderCard a ~160px de ancho hace los botones de acción inutilizables.
 *
 * FIX:
 *   - En mobile (<lg): lista vertical flat con badge de estado + botón primario
 *   - En desktop (lg+): kanban existente sin cambios
 *
 * Componentes shadcn/ui usados: Badge, Button (ya presentes en el repo)
 */

import type { PickupWindowGroup, Order, OrderStatus } from '../lib/api'
import { OrderCard } from './order-card'
import { Badge }    from '@/components/ui/badge'
import { Button }   from '@/components/ui/button'

interface Props {
    window:   PickupWindowGroup
    onAction: (orderId: string, newStatus: OrderStatus) => Promise<void>
    loading:  boolean
}

const COLUMNS: {
    key:      string
    label:    string
    statuses: OrderStatus[]
    color:    string
    bg:       string
}[] = [
    { key: 'pending',   label: 'Por preparar', statuses: ['CONFIRMED'],           color: 'var(--warning)',  bg: 'rgba(255,176,32,0.08)' },
    { key: 'preparing', label: 'Preparando',   statuses: ['PREPARING'],           color: 'var(--primary)', bg: 'var(--primary-dim)'    },
    { key: 'ready',     label: 'Listos',       statuses: ['READY', 'PICKED_UP'],  color: 'var(--success)', bg: 'rgba(0,214,143,0.08)'  },
]

// ── Mobile: acción primaria según status ──────────────────────────────────────

function MobileActionButton({
                                order,
                                onAction,
                                loading,
                            }: {
    order:    Order
    onAction: (orderId: string, newStatus: OrderStatus) => Promise<void>
    loading:  boolean
}) {
    if (order.status === 'CONFIRMED') {
        return (
            <Button
                variant="warning"
                size="sm"
                disabled={loading}
                onClick={() => void onAction(order.id, 'PREPARING')}
                className="text-xs"
            >
                Preparar
            </Button>
        )
    }
    if (order.status === 'PREPARING') {
        return (
            <Button
                variant="success"
                size="sm"
                disabled={loading}
                onClick={() => void onAction(order.id, 'READY')}
                className="text-xs"
            >
                Listo ✓
            </Button>
        )
    }
    if (order.status === 'READY') {
        return (
            <Button
                size="sm"
                disabled={loading}
                onClick={() => void onAction(order.id, 'PICKED_UP')}
                className="text-xs bg-gradient-teal-violet shadow-glow hover:opacity-90"
            >
                Entregar
            </Button>
        )
    }
    return null
}

// ── Mobile: badge de estado ───────────────────────────────────────────────────

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

// ── Mobile: fila de pedido ────────────────────────────────────────────────────

function MobileOrderRow({
                            order,
                            onAction,
                            loading,
                        }: {
    order:    Order
    onAction: (orderId: string, newStatus: OrderStatus) => Promise<void>
    loading:  boolean
}) {
    const isDone =
        order.status === 'PICKED_UP' ||
        order.status === 'CANCELLED' ||
        order.status === 'EXPIRED'

    if (isDone) return null // Ocultamos completados en mobile para reducir ruido

    return (
        <div className="glass rounded-xl p-3 flex items-center gap-3">
            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
          <span
              className="font-mono text-sm font-bold text-gradient"
              style={{ letterSpacing: '0.06em' }}
          >
            {order.pickupCode ?? '—'}
          </span>
                    <MobileStatusBadge status={order.status} />
                </div>
                <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                    {order.customer.displayName ?? order.customer.phone}
                </p>
                {/* Items summary */}
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                    {order.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}
                </p>
                {order.notes && (
                    <p className="text-[11px] mt-1" style={{ color: 'var(--warning)' }}>
                        📝 {order.notes}
                    </p>
                )}
            </div>

            {/* Action */}
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

    // Conteos por grupo para el header mobile
    const pendingCount   = activeOrders.filter(o => o.status === 'CONFIRMED').length
    const preparingCount = activeOrders.filter(o => o.status === 'PREPARING').length
    const readyCount     = activeOrders.filter(o => o.status === 'READY' || o.status === 'PICKED_UP').length

    return (
        <section className="glass rounded-2xl overflow-hidden">
            {/* Window header — compartido mobile/desktop */}
            <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{ borderColor: 'var(--border)' }}
            >
                <div className="flex items-center gap-3 flex-wrap">
          <span
              className="rounded-lg px-2.5 py-1 text-xs font-semibold"
              style={{
                  fontFamily:      'var(--font-mono)',
                  backgroundColor: 'var(--primary-dim)',
                  color:           'var(--primary)',
                  border:          '1px solid var(--border-glow)',
              }}
          >
            {w.startTime} – {w.endTime}
          </span>
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>
            {activeOrders.length}/{w.capacity} cupos
          </span>
                    {/* Status summary badges — solo en mobile */}
                    <div className="flex gap-1.5 lg:hidden">
                        {pendingCount   > 0 && <Badge variant="warning">{pendingCount} por prep.</Badge>}
                        {preparingCount > 0 && <Badge variant="default">{preparingCount} prep.</Badge>}
                        {readyCount     > 0 && <Badge variant="success">{readyCount} listos</Badge>}
                    </div>
                </div>

                {/* Occupancy bar — solo en desktop */}
                <div className="hidden lg:flex items-center gap-2">
                    <div
                        className="h-1.5 w-24 rounded-full overflow-hidden"
                        style={{ backgroundColor: 'var(--border)' }}
                    >
                        <div
                            className="h-full rounded-full transition-all"
                            style={{
                                width:           `${Math.min(occupancy, 100)}%`,
                                backgroundColor: occupancy > 80 ? 'var(--error)' : 'var(--primary)',
                            }}
                        />
                    </div>
                    <span className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            {occupancy}%
          </span>
                </div>
            </div>

            {/* ── MOBILE: lista vertical ─────────────────────────────────── */}
            <div className="lg:hidden">
                {activeOrders.length === 0 ? (
                    <p className="py-6 text-center text-sm" style={{ color: 'var(--muted)' }}>
                        Sin pedidos activos
                    </p>
                ) : (
                    <div className="flex flex-col gap-2 p-3">
                        {activeOrders.map((order) => (
                            <MobileOrderRow
                                key={order.id}
                                order={order}
                                onAction={onAction}
                                loading={loading}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── DESKTOP: kanban 3 columnas (sin cambios) ──────────────── */}
            <div className="hidden lg:block overflow-x-auto">
                <div className="grid grid-cols-3 min-w-[480px]">
                    {COLUMNS.map((col, i) => {
                        const colOrders = activeOrders.filter((o) => col.statuses.includes(o.status))
                        return (
                            <div
                                key={col.key}
                                className="flex flex-col"
                                style={i > 0 ? { borderLeft: '1px solid var(--border)' } : {}}
                            >
                                <div
                                    className="flex items-center gap-2 px-3 py-2"
                                    style={{ borderBottom: '1px solid var(--border)' }}
                                >
                  <span
                      className="inline-block h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: col.color }}
                  />
                                    <span
                                        className="text-[11px] font-semibold uppercase tracking-wide"
                                        style={{ color: col.color }}
                                    >
                    {col.label}
                  </span>
                                    {colOrders.length > 0 && (
                                        <span
                                            className="ml-auto text-[10px] font-semibold rounded-full px-1.5 py-0.5"
                                            style={{ fontFamily: 'var(--font-mono)', backgroundColor: col.bg, color: col.color }}
                                        >
                      {colOrders.length}
                    </span>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2 p-2 min-h-[80px]">
                                    {colOrders.length === 0 ? (
                                        <p className="py-4 text-center text-xs" style={{ color: 'var(--muted)' }}>—</p>
                                    ) : (
                                        colOrders.map((order) => (
                                            <OrderCard
                                                key={order.id}
                                                order={order}
                                                onAction={onAction}
                                                loading={loading}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
