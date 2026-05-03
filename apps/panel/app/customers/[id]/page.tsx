'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getCustomerDetail, type CustomerDetail, type CustomerOrder } from '../../../lib/api'

// ── Status badge ──────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: 'Confirmado',  color: '#818CF8', bg: 'rgba(99,102,241,0.12)'  },
  PREPARING: { label: 'Preparando',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)'  },
  READY:     { label: 'Listo',       color: '#A855F7', bg: 'rgba(168,85,247,0.12)'  },
  PICKED_UP: { label: 'Entregado',   color: '#10B981', bg: 'rgba(16,185,129,0.12)'  },
  CANCELLED: { label: 'Cancelado',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)'   },
  EXPIRED:   { label: 'Expirado',    color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
  DRAFT:     { label: 'Borrador',    color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
}

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: 'var(--muted)', bg: 'var(--surface)' }
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-lg"
      style={{ color: meta.color, background: meta.bg }}
    >
      {meta.label}
    </span>
  )
}

// ── Order accordion item ──────────────────────────────────────────────────────

function OrderRow({ order }: { order: CustomerOrder }) {
  const [open, setOpen] = useState(false)
  const date = order.confirmedAt
    ? new Date(order.confirmedAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

  return (
    <div className="glass rounded-xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{date}</span>
          {order.pickupCode && (
            <span
              className="text-xs font-mono font-bold px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}
            >
              #{order.pickupCode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold font-mono text-gradient">
            ${order.subtotal.toFixed(2)}
          </span>
          <span style={{ color: 'var(--muted)' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 border-t" style={{ borderColor: 'var(--glass-border)' }}>
          <ul className="flex flex-col gap-1.5 mt-2">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-xs">
                <span style={{ color: 'var(--text)' }}>
                  {item.name}{' '}
                  <span style={{ color: 'var(--muted)' }}>×{item.quantity} {item.unitLabel}</span>
                </span>
                <span className="font-mono" style={{ color: 'var(--muted)' }}>
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
    <div className="glass rounded-xl p-3 flex flex-col gap-0.5">
      <span className="text-lg">{icon}</span>
      <p
        className={`text-xl font-black font-mono ${gradient ? 'text-gradient' : ''}`}
        style={gradient ? undefined : { color: 'var(--text)' }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
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
    const token = sessionStorage.getItem('panel_token')
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
      <header
        className="sticky top-0 z-10 glass px-6 py-4"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-all"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            ←
          </Link>
          <h1 className="text-lg font-bold text-gradient truncate">{loading ? 'Cargando…' : name}</h1>
          {isVip && !loading && (
            <span
              className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(168,85,247,0.15)', color: '#A855F7' }}
            >
              ⭐ VIP
            </span>
          )}
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-5">
        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(248,113,113,0.08)', color: 'var(--error)', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p style={{ color: 'var(--muted)' }}>Cargando…</p>
          </div>
        ) : detail ? (
          <>
            {/* Contact info */}
            <div className="glass rounded-2xl p-4 flex flex-col gap-1">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-teal-violet flex-shrink-0">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate" style={{ color: 'var(--text)' }}>{name}</p>
                  {contact && (
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{contact}</p>
                  )}
                  {joined && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
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
              <StatCard
                icon="📦"
                label="Pedidos"
                value={String(detail.stats.totalOrders)}
              />
              <StatCard
                icon="❌"
                label="Cancelados"
                value={String(detail.stats.cancelledCount)}
              />
              <StatCard
                icon="🕐"
                label="Último pedido"
                value={lastOrder}
              />
            </div>

            {/* Orders history */}
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
                Historial de pedidos
              </p>
              {detail.orders.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center">
                  <p style={{ color: 'var(--muted)' }}>Sin pedidos registrados</p>
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
