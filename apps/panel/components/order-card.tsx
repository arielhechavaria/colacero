'use client'

import type { Order, OrderStatus } from '../lib/api'
import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'

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
    <div className={`bg-white rounded-xl border border-slate-200 p-3 transition-all hover:shadow-sm ${isDone ? 'opacity-40' : ''}`}>
      {/* Code + customer + status dot */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <span className="text-sm font-bold font-mono block text-indigo-600 tracking-wide">
            {order.pickupCode ?? '—'}
          </span>
          <p className="text-[11px] truncate mt-0.5 text-slate-500">
            {order.customer.displayName ?? order.customer.phone}
          </p>
        </div>
        <StatusDot status={order.status} />
      </div>

      {/* Items */}
      <ul className="flex flex-col gap-0.5 mb-2 pt-2 border-t border-slate-100">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center text-[11px]">
            <span className="text-slate-900">{item.name}</span>
            <span className="ml-1 text-slate-500">× {item.quantity}</span>
          </li>
        ))}
      </ul>

      {/* Total */}
      <p className="text-xs font-semibold font-mono mb-2 text-slate-900">
        ${order.subtotal.toFixed(2)}
      </p>

      {/* Notas del cliente */}
      {order.notes && (
        <p className="mb-2 rounded-lg px-2 py-1.5 text-[11px] leading-snug bg-amber-50 text-amber-700 border-l-2 border-amber-400">
          📝 {order.notes}
        </p>
      )}

      {/* Actions */}
      {!isDone && (
        <div className="flex gap-1.5">
          {order.status === 'CONFIRMED' && (
            <Button variant="warning" size="sm" className="flex-1" disabled={loading} onClick={() => void onAction(order.id, 'PREPARING')}>
              Preparar
            </Button>
          )}
          {order.status === 'PREPARING' && (
            <Button variant="success" size="sm" className="flex-1" disabled={loading} onClick={() => void onAction(order.id, 'READY')}>
              Listo ✓
            </Button>
          )}
          {order.status === 'READY' && (
            <Button size="sm" className="flex-1 bg-gradient-teal-violet shadow-glow hover:opacity-90" disabled={loading} onClick={() => void onAction(order.id, 'PICKED_UP')}>
              Entregado
            </Button>
          )}
          {order.status !== 'PICKED_UP' && (
            <Button variant="destructive" size="sm" disabled={loading} onClick={() => void onAction(order.id, 'CANCELLED')}>
              ×
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function StatusDot({ status }: { status: OrderStatus }) {
  const variantMap: Partial<Record<OrderStatus, 'warning' | 'default' | 'success'>> = {
    CONFIRMED: 'warning',
    PREPARING: 'default',
    READY:     'success',
  }
  const variant = variantMap[status]
  if (!variant) return null
  return <Badge variant={variant}>{STATUS_LABEL[status]}</Badge>
}
