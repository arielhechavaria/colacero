'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCustomerDetail, type CustomerDetail, type CustomerOrder, isAuthenticatedClient } from '../../../lib/api'
import { Badge } from '@/components/ui/badge'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline' }> = {
  CONFIRMED: { label: 'Confirmado', variant: 'default'     },
  PREPARING: { label: 'Preparando', variant: 'warning'     },
  READY:     { label: 'Listo',      variant: 'success'     },
  PICKED_UP: { label: 'Entregado',  variant: 'success'     },
  CANCELLED: { label: 'Cancelado',  variant: 'destructive' },
  EXPIRED:   { label: 'Expirado',   variant: 'secondary'   },
  DRAFT:     { label: 'Borrador',   variant: 'secondary'   },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, variant: 'outline' as const }
  return <Badge variant={meta.variant}>{meta.label}</Badge>
}

// ── Order accordion item ──────────────────────────────────────────────────────

function OrderRow({ order }: { order: CustomerOrder }) {
  const [open, setOpen] = useState(false)
  const date = order.confirmedAt
    ? new Date(order.confirmedAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="text-xs font-mono text-slate-500">{date}</span>
          {order.pickupCode && (
            <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
              #{order.pickupCode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold font-mono text-indigo-600">
            ${order.subtotal.toFixed(2)}
          </span>
          <span className="text-slate-400">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 border-t border-slate-100">
          <ul className="flex flex-col gap-1.5 mt-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-xs">
                <span className="text-slate-900">
                  {item.name}{' '}
                  <span className="text-slate-500">×{item.quantity} {item.unitLabel}</span>
                </span>
                <span className="font-mono text-slate-500">
                  ${item.subtotal.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, gradient }: { icon: string; label: string; value: string; gradient?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col gap-0.5">
      <span className="text-lg">{icon}</span>
      <p className={`text-xl font-black font-mono ${gradient ? 'text-indigo-600' : 'text-slate-900'}`}>
        {value}
      </p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [detail,  setDetail]  = useState<CustomerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    const token = (isAuthenticatedClient() ? '1' : null)
    if (!token) { router.replace('/login'); return }

    setLoading(true)
    getCustomerDetail(token, params.id)
      .then(setDetail)
      .catch(() => setError('Error al cargar cliente'))
      .finally(() => setLoading(false))
  }, [router, params.id])

  const name = detail?.customer.displayName
    ?? detail?.customer.phone
    ?? detail?.customer.telegramId
    ?? 'Cliente anónimo'

  const contact = detail?.customer.phone
    ?? (detail?.customer.telegramId ? `Telegram: ${detail.customer.telegramId}` : null)

  const joined = detail?.customer.createdAt
    ? new Date(detail.customer.createdAt).toLocaleDateString('es', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  const lastOrder = detail?.stats.lastOrderAt
    ? new Date(detail.stats.lastOrderAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Nunca'

  const isVip = (detail?.stats.totalOrders ?? 0) >= 5 || (detail?.stats.totalSpent ?? 0) >= 50

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all"
          >
            ←
          </Link>
          <h1 className="text-lg font-bold text-slate-900 truncate">{loading ? 'Cargando…' : name}</h1>
          {isVip && !loading && (
            <Badge variant="secondary" className="flex-shrink-0 bg-purple-100 text-purple-600">
              ⭐ VIP
            </Badge>
          )}
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-5">
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-slate-500">Cargando…</p>
          </div>
        ) : detail ? (
          <>
            {/* Contact info */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col gap-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-indigo-600 flex-shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate text-slate-900">{name}</p>
                  {contact && (
                    <p className="text-sm text-slate-500">{contact}</p>
                  )}
                  {joined && (
                    <p className="text-xs mt-0.5 text-slate-500">
                      Cliente desde {joined}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard
                icon="💰"
                label="Total gastado"
                value={`$${(detail.stats.totalSpent).toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                gradient
              />
              <StatCard icon="📦" label="Pedidos"    value={String(detail.stats.totalOrders)} />
              <StatCard icon="❌" label="Cancelados" value={String(detail.stats.cancelledCount)} />
              <StatCard icon="🕐" label="Último pedido" value={lastOrder} />
            </div>

            {/* Orders history */}
            <div>
              <p className="text-sm font-semibold mb-3 text-slate-900">
                Historial de pedidos
              </p>
              {detail.orders.length === 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                  <p className="text-slate-500">Sin pedidos registrados</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {detail.orders.map((o) => <OrderRow key={o.id} order={o} />)}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}
