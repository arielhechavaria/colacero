'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  getStatsSummary,
  getTopProducts,
  type StatsPeriod,
  type StatsSummary,
  type TopProduct,
} from '../../lib/api'

// ── Period selector ───────────────────────────────────────────────────────────

const PERIODS: { key: StatsPeriod; label: string }[] = [
  { key: 'today', label: 'Hoy'           },
  { key: 'week',  label: 'Esta semana'   },
  { key: 'month', label: 'Este mes'      },
]

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  gradient,
}: {
  icon:      string
  label:     string
  value:     string
  sub?:      string
  gradient?: boolean
}) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xl">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          {label}
        </span>
      </div>
      <p className={`text-3xl font-black font-mono ${gradient ? 'text-gradient' : ''}`}
        style={gradient ? undefined : { color: 'var(--text)' }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</p>
      )}
    </div>
  )
}

// ── Fulfillment bar ───────────────────────────────────────────────────────────

function FulfillmentBar({ rate, delivered, total }: { rate: number; delivered: number; total: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Tasa de cumplimiento</p>
        <p className="text-xl font-black font-mono text-gradient">{rate.toFixed(1)}%</p>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div
          className="h-full rounded-full bg-gradient-teal-violet transition-all duration-700"
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
        {delivered} entregados de {total} pedidos en el período
      </p>
    </div>
  )
}

// ── Top products ──────────────────────────────────────────────────────────────

function TopProductsList({ items }: { items: TopProduct[] }) {
  if (items.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p style={{ color: 'var(--muted)' }}>Sin ventas en este período</p>
      </div>
    )
  }

  const maxQty = items[0]?.totalQty ?? 1

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text)' }}>
        Productos más vendidos
      </p>
      <ul className="flex flex-col gap-3">
        {items.map((item, i) => {
          const pct = maxQty > 0 ? (item.totalQty / maxQty) * 100 : 0
          return (
            <li key={item.productId}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex-shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-teal-violet"
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                  <span className="text-xs font-mono font-semibold text-gradient">
                    ${item.totalRev.toFixed(2)}
                  </span>
                  <span
                    className="text-xs font-mono px-1.5 py-0.5 rounded-lg"
                    style={{ background: 'var(--primary-dim)', color: 'var(--primary)' }}
                  >
                    {item.totalQty} {item.unitLabel}
                  </span>
                </div>
              </div>
              {/* Bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                <div
                  className="h-full rounded-full bg-gradient-teal-violet transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const [period,   setPeriod]   = useState<StatsPeriod>('today')
  const [summary,  setSummary]  = useState<StatsSummary | null>(null)
  const [topProds, setTopProds] = useState<TopProduct[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  const tokenRef = useRef<string | null>(null)

  const load = useCallback(async (tok: string, p: StatsPeriod) => {
    setLoading(true)
    setError(null)
    try {
      const [s, t] = await Promise.all([
        getStatsSummary(tok, p),
        getTopProducts(tok, p, 5),
      ])
      setSummary(s)
      setTopProds(t)
    } catch {
      setError('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
    void load(token, period)
  }, [load, router, period])

  function changePeriod(p: StatsPeriod) {
    setPeriod(p)
    // load is triggered by the effect above via period dependency
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen">
      {/* Header glass */}
      <header
        className="sticky top-0 z-10 glass px-6 py-4"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-gradient">Dashboard</h1>

          {/* Period tabs */}
          <div
            className="flex rounded-xl p-0.5 gap-0.5"
            style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)' }}
          >
            {PERIODS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => changePeriod(key)}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-all"
                style={
                  period === key
                    ? { background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff' }
                    : { color: 'var(--muted)' }
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-5">
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(248,113,113,0.08)', color: 'var(--error)', border: '1px solid rgba(248,113,113,0.2)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p style={{ color: 'var(--muted)' }}>Cargando métricas…</p>
          </div>
        ) : summary ? (
          <>
            {/* KPI grid */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard
                icon="💰"
                label="Ingresos"
                value={`$${summary.revenue.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                sub={`${summary.ordersCount} pedido${summary.ordersCount !== 1 ? 's' : ''}`}
                gradient
              />
              <KpiCard
                icon="📦"
                label="Pedidos"
                value={String(summary.ordersCount)}
                sub={`${summary.cancelledCount} cancelado${summary.cancelledCount !== 1 ? 's' : ''}`}
              />
              <KpiCard
                icon="✅"
                label="Entregados"
                value={String(summary.deliveredCount)}
                sub={`de ${summary.ordersCount + summary.cancelledCount} totales`}
              />
              <KpiCard
                icon="🧾"
                label="Ticket medio"
                value={summary.ordersCount > 0
                  ? `$${summary.avgTicket.toFixed(2)}`
                  : '—'}
                gradient={summary.ordersCount > 0}
              />
            </div>

            {/* Fulfillment */}
            <FulfillmentBar
              rate={summary.fulfillmentRate}
              delivered={summary.deliveredCount}
              total={summary.ordersCount + summary.cancelledCount}
            />

            {/* Top products */}
            <TopProductsList items={topProds} />
          </>
        ) : null}
      </div>
    </main>
  )
}
