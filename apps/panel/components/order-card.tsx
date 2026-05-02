'use client'

import type { Order, OrderStatus } from '../lib/api'

const STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT:     'Borrador',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY:     'Listo ✓',
  PICKED_UP: 'Retirado',
  CANCELLED: 'Cancelado',
  EXPIRED:   'Expirado',
}

interface Props {
  order:    Order
  onAction: (orderId: string, newStatus: OrderStatus) => Promise<void>
  loading:  boolean
}

export function OrderCard({ order, onAction, loading }: Props) {
  const isDone =
    order.status === 'PICKED_UP' ||
    order.status === 'CANCELLED' ||
    order.status === 'EXPIRED'

  return (
    <div
      className={`rounded-xl border p-3 transition-all ${isDone ? 'opacity-40' : ''}`}
      style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
    >
      {/* Code + customer + status dot */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <span
            className="text-sm font-bold block"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--primary)',
              letterSpacing: '0.08em',
            }}
          >
            {order.pickupCode ?? '—'}
          </span>
          <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--muted)' }}>
            {order.customer.displayName ?? order.customer.phone}
          </p>
        </div>
        <StatusDot status={order.status} />
      </div>

      {/* Items */}
      <ul
        className="flex flex-col gap-0.5 mb-2 pt-2 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center text-[11px]">
            <span style={{ color: 'var(--text)' }}>{item.name}</span>
            <span className="ml-1" style={{ color: 'var(--muted)' }}>× {item.quantity}</span>
          </li>
        ))}
      </ul>

      {/* Total */}
      <p
        className="text-xs font-semibold mb-2"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}
      >
        ${order.subtotal.toFixed(2)}
      </p>

      {/* Actions */}
      {!isDone && (
        <div className="flex gap-1.5">
          {order.status === 'CONFIRMED' && (
            <ActionBtn
              label="Preparar"
              bgColor="rgba(255,176,32,0.15)"
              textColor="var(--warning)"
              onClick={() => void onAction(order.id, 'PREPARING')}
              disabled={loading}
            />
          )}
          {order.status === 'PREPARING' && (
            <ActionBtn
              label="Listo ✓"
              bgColor="rgba(0,214,143,0.15)"
              textColor="var(--success)"
              onClick={() => void onAction(order.id, 'READY')}
              disabled={loading}
            />
          )}
          {order.status === 'READY' && (
            <ActionBtn
              label="Entregado"
              bgColor="var(--primary-dim)"
              textColor="var(--primary)"
              onClick={() => void onAction(order.id, 'PICKED_UP')}
              disabled={loading}
            />
          )}
          {order.status !== 'PICKED_UP' && (
            <ActionBtn
              label="×"
              bgColor="rgba(255,61,85,0.1)"
              textColor="var(--error)"
              onClick={() => void onAction(order.id, 'CANCELLED')}
              disabled={loading}
            />
          )}
        </div>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: OrderStatus }) {
  const colorMap: Partial<Record<OrderStatus, string>> = {
    CONFIRMED: 'var(--warning)',
    PREPARING: 'var(--primary)',
    READY:     'var(--success)',
  }
  const color = colorMap[status] ?? 'var(--muted)'
  return (
    <span
      className="inline-block h-2 w-2 rounded-full flex-shrink-0 mt-1"
      style={{ backgroundColor: color }}
    />
  )
}

function ActionBtn({
  label,
  bgColor,
  textColor = 'var(--text)',
  onClick,
  disabled,
}: {
  label:      string
  bgColor:    string
  textColor?: string
  onClick:    () => void
  disabled:   boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex-1 rounded-lg py-1.5 text-xs font-semibold disabled:opacity-40 transition-opacity"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {label}
    </button>
  )
}
