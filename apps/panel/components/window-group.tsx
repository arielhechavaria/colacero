'use client'

import type { PickupWindowGroup, Order, OrderStatus } from '../lib/api'
import { OrderCard } from './order-card'

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

export function WindowGroup({ window: w, onAction, loading }: Props) {
  const activeOrders = w.orders.filter(
    (o) => o.status !== 'CANCELLED' && o.status !== 'EXPIRED' && o.status !== 'DRAFT',
  )
  const occupancy = w.capacity > 0 ? Math.round((activeOrders.length / w.capacity) * 100) : 0

  return (
    <section
      className="glass rounded-2xl overflow-hidden"
    >
      {/* Window header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <span
            className="rounded-lg px-2.5 py-1 text-xs font-semibold"
            style={{
              fontFamily: 'var(--font-mono)',
              backgroundColor: 'var(--primary-dim)',
              color: 'var(--primary)',
              border: '1px solid var(--border-glow)',
            }}
          >
            {w.startTime} – {w.endTime}
          </span>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            {activeOrders.length}/{w.capacity} cupos
          </span>
        </div>

        {/* Occupancy bar */}
        <div className="flex items-center gap-2">
          <div
            className="h-1.5 w-24 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--border)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(occupancy, 100)}%`,
                backgroundColor: occupancy > 80 ? 'var(--error)' : 'var(--primary)',
              }}
            />
          </div>
          <span className="text-[11px]" style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
            {occupancy}%
          </span>
        </div>
      </div>

      {/* Kanban 3 columns */}
      <div className="overflow-x-auto">
      <div className="grid grid-cols-3 min-w-[480px]">
        {COLUMNS.map((col, i) => {
          const colOrders = activeOrders.filter((o) => col.statuses.includes(o.status))
          return (
            <div
              key={col.key}
              className="flex flex-col"
              style={i > 0 ? { borderLeft: '1px solid var(--border)' } : {}}
            >
              {/* Column header */}
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

              {/* Order cards */}
              <div className="flex flex-col gap-2 p-2 min-h-[80px]">
                {colOrders.length === 0 ? (
                  <p className="py-4 text-center text-xs" style={{ color: 'var(--muted)' }}>
                    —
                  </p>
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
      </div>{/* overflow-x-auto */}
    </section>
  )
}
