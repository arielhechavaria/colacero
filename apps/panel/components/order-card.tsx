'use client'

import { motion } from 'framer-motion'
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
    <motion.div
      className={`bg-white/[0.04] rounded-xl border border-white/[0.08] p-3 ${isDone ? 'opacity-40' : ''}`}
      whileHover={isDone ? {} : {
        y: -2,
        boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
      }}
      whileTap={isDone ? {} : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      {/* Code + customer + status dot */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <span className="text-sm font-bold font-mono block text-indigo-400 tracking-wide">
            {order.pickupCode ?? '—'}
          </span>
          <p className="text-[11px] truncate mt-0.5 text-slate-500">
            {order.customer.displayName ?? order.customer.phone}
          </p>
        </div>
        <StatusDot status={order.status} />
      </div>

      {/* Items */}
      <ul className="flex flex-col gap-0.5 mb-2 pt-2 border-t border-white/[0.06]">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center text-[11px]">
            <span className="text-slate-200">{item.name}</span>
            <span className="ml-1 text-slate-500">× {item.quantity}</span>
          </li>
        ))}
      </ul>

      {/* Total */}
      <p className="text-xs font-semibold font-mono mb-2 text-slate-300">
        ${order.subtotal.toFixed(2)}
      </p>

      {/* Notas del cliente */}
      {order.notes && (
        <p className="mb-2 rounded-lg px-2 py-1.5 text-[11px] leading-snug bg-amber-500/10 text-amber-400 border-l-2 border-amber-500/50">
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
    </motion.div>
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
