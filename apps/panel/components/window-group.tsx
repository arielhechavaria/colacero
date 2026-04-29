'use client'

import type { PickupWindowGroup, OrderStatus } from '../lib/api'
import { OrderCard } from './order-card'

interface Props {
  window:   PickupWindowGroup
  onAction: (orderId: string, newStatus: OrderStatus) => Promise<void>
  loading:  boolean
}

export function WindowGroup({ window: w, onAction, loading }: Props) {
  const activeOrders = w.orders.filter(
    (o) => o.status !== 'CANCELLED' && o.status !== 'EXPIRED' && o.status !== 'DRAFT',
  )

  return (
    <section className="rounded-2xl bg-gray-50 p-4">
      {/* Window header */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-900">
            {w.startTime} – {w.endTime}
          </p>
        </div>
        <span className="rounded-full bg-gray-200 px-3 py-0.5 text-xs font-medium text-gray-600">
          {activeOrders.length}/{w.capacity} pedidos
        </span>
      </div>

      {/* Orders */}
      {activeOrders.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-400">
          Sin pedidos en esta ventana
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {activeOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onAction={onAction}
              loading={loading}
            />
          ))}
        </div>
      )}
    </section>
  )
}
