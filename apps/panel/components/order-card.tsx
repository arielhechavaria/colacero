'use client'

import type { Order, OrderStatus } from '../lib/api'

const STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT:     'Borrador',
  CONFIRMED: 'Confirmado',
  PREPARING: 'En preparación',
  READY:     'Listo',
  PICKED_UP: 'Retirado',
  CANCELLED: 'Cancelado',
  EXPIRED:   'Expirado',
}

const STATUS_COLOR: Record<OrderStatus, string> = {
  DRAFT:     'bg-gray-100 text-gray-500',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PREPARING: 'bg-orange-100 text-orange-700',
  READY:     'bg-green-100 text-green-700',
  PICKED_UP: 'bg-gray-100 text-gray-400',
  CANCELLED: 'bg-gray-100 text-gray-400',
  EXPIRED:   'bg-gray-100 text-gray-400',
}

interface Props {
  order:    Order
  onAction: (orderId: string, newStatus: OrderStatus) => Promise<void>
  loading:  boolean
}

export function OrderCard({ order, onAction, loading }: Props) {
  const isDone = order.status === 'PICKED_UP' || order.status === 'CANCELLED' || order.status === 'EXPIRED'

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-opacity ${
        isDone ? 'opacity-50' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-mono text-xl font-bold tracking-widest text-gray-800">
            {order.pickupCode ?? '—'}
          </span>
          <p className="mt-0.5 text-sm text-gray-500">
            {order.customer.displayName ?? order.customer.phone}
          </p>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[order.status]}`}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      {/* Items */}
      <ul className="mt-3 flex flex-col gap-1">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">
              {item.name}{' '}
              <span className="text-gray-400">× {item.quantity} {item.unitLabel}</span>
            </span>
            <span className="text-gray-500">${item.subtotal.toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t pt-2">
        <span className="text-sm font-semibold text-gray-900">
          Total: ${order.subtotal.toFixed(2)}
        </span>
      </div>

      {/* Action buttons */}
      {!isDone && (
        <div className="mt-3 flex gap-2">
          {order.status === 'CONFIRMED' && (
            <ActionButton
              label="Preparar"
              color="bg-orange-500 hover:bg-orange-600"
              onClick={() => void onAction(order.id, 'PREPARING')}
              disabled={loading}
            />
          )}
          {order.status === 'PREPARING' && (
            <ActionButton
              label="Listo"
              color="bg-green-600 hover:bg-green-700"
              onClick={() => void onAction(order.id, 'READY')}
              disabled={loading}
            />
          )}
          {order.status === 'READY' && (
            <ActionButton
              label="Entregado"
              color="bg-teal-700 hover:bg-teal-800"
              onClick={() => void onAction(order.id, 'PICKED_UP')}
              disabled={loading}
            />
          )}
          {order.status !== 'READY' && (
            <ActionButton
              label="Cancelar"
              color="bg-red-500 hover:bg-red-600"
              onClick={() => void onAction(order.id, 'CANCELLED')}
              disabled={loading}
            />
          )}
        </div>
      )}
    </div>
  )
}

function ActionButton({
  label, color, onClick, disabled,
}: {
  label:    string
  color:    string
  onClick:  () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 rounded-lg py-2 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${color}`}
    >
      {label}
    </button>
  )
}
