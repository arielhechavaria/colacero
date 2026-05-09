'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getStatsSummary,
  getTopProducts,
  getCoPurchases,
  getWeeklyTrends,
  getStockAlerts,
  type StatsRange,
  type StatsSummary,
  type TopProduct,
  type CoPurchasePair,
  type WeeklyDay,
  type StockAlert,
} from '../../lib/api'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PeriodSelector } from '../../components/period-selector'

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon,
  label,
  value,
  sub,
  gradient,
  href,
}: {
  icon:      string
  label:     string
  value:     string
  sub?:      string
  gradient?: boolean
  href?:     string
}) {
  const card = (
    <div className={`glass rounded-2xl p-5 flex flex-col gap-1 ${href ? 'transition-opacity hover:opacity-80 cursor-pointer' : ''}`}>
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
  if (href) return <Link href={href} className="block">{card}</Link>
  return card
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

// ── Co-purchases ─────────────────────────────────────────────────────────────

function CoPurchasesCard({ pairs }: { pairs: CoPurchasePair[] }) {
  if (pairs.length === 0) return null

  const max = pairs[0]?.count ?? 1

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
        Combos frecuentes
      </p>
      <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>
        Productos que se piden juntos — últimos 28 días
      </p>
      <ul className="flex flex-col gap-3">
        {pairs.map((pair, i) => {
          const pct = max > 0 ? (pair.count / max) * 100 : 0
          return (
            <li key={i} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-sm truncate" style={{ color: 'var(--text)' }}>
                  {pair.nameA}
                  <span className="mx-1.5" style={{ color: 'var(--muted)' }}>+</span>
                  {pair.nameB}
                </span>
                <span className="ml-3 flex-shrink-0 text-xs font-mono font-bold text-gradient">
                  {pair.count}×
                </span>
              </div>
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

// ── Weekly chart ──────────────────────────────────────────────────────────────

function WeeklyChart({ days }: { days: WeeklyDay[] }) {
  const maxOrders = Math.max(...days.map((d) => d.orders), 1)

  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
        Pedidos por día de la semana
      </p>
      <p className="text-xs mb-5" style={{ color: 'var(--muted)' }}>
        Últimas 4 semanas
      </p>
      <div className="flex items-end justify-between gap-2 h-28">
        {days.map((day) => {
          const pct = (day.orders / maxOrders) * 100
          return (
            <div key={day.day} className="flex flex-1 flex-col items-center gap-1">
              <span
                className="text-[10px] font-mono font-semibold"
                style={{ color: day.orders > 0 ? 'var(--primary)' : 'transparent' }}
              >
                {day.orders}
              </span>
              <div
                className="w-full rounded-t-lg bg-gradient-teal-violet transition-all duration-700"
                style={{ height: `${Math.max(pct, day.orders > 0 ? 5 : 0)}%` }}
              />
              <span className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                {day.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Stock alerts ──────────────────────────────────────────────────────────────

function StockAlertsList({ alerts }: { alerts: StockAlert[] }) {
  if (alerts.length === 0) {
    return (
      <div className="glass rounded-2xl p-5 flex items-center gap-3">
        <span className="text-xl">✅</span>
        <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
          Todo el stock en orden
        </p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          Alertas de stock
        </p>
        <Badge variant="destructive">
          {alerts.length} producto{alerts.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      <ul className="flex flex-col gap-2">
        {alerts.map((a) => (
          <li key={a.productId}>
            <Link href="/products" className="flex items-center justify-between text-sm transition-opacity hover:opacity-70">
              <span style={{ color: 'var(--text)' }}>{a.name}</span>
              <Badge variant={a.status === 'out' ? 'destructive' : 'warning'} className="ml-3 flex-shrink-0">
                {a.status === 'out' ? 'Sin stock' : `${a.quantityAvailable} restantes`}
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()

  const [range,       setRange]       = useState<StatsRange>({ period: 'today' })
  const [summary,     setSummary]     = useState<StatsSummary | null>(null)
  const [topProds,    setTopProds]    = useState<TopProduct[]>([])
  const [coPurchases, setCoPurchases] = useState<CoPurchasePair[]>([])
  const [weeklyDays,  setWeeklyDays]  = useState<WeeklyDay[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  const tokenRef = useRef<string | null>(null)

  const load = useCallback(async (tok: string, r: StatsRange) => {
    setLoading(true)
    setError(null)
    try {
      const [s, t, co, wk, sa] = await Promise.all([
        getStatsSummary(tok, r),
        getTopProducts(tok, r, 5),
        getCoPurchases(tok),
        getWeeklyTrends(tok),
        getStockAlerts(tok),
      ])
      setSummary(s)
      setTopProds(t)
      setCoPurchases(co)
      setWeeklyDays(wk)
      setStockAlerts(sa)
    } catch {
      toast.error('Error al cargar estadísticas')
      setError('Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
    void load(token, range)
  }, [load, router, range])

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

          {/* Period selector */}
          <PeriodSelector range={range} onChange={setRange} />
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
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="glass rounded-2xl p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
            <div className="glass rounded-2xl p-5">
              <Skeleton className="h-3 w-32 mb-3" />
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-24 mt-2" />
            </div>
            <div className="glass rounded-2xl p-5 flex flex-col gap-3">
              <Skeleton className="h-3 w-40 mb-1" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
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
                href="/orders"
              />
              <KpiCard
                icon="✅"
                label="Entregados"
                value={String(summary.deliveredCount)}
                sub={`de ${summary.ordersCount + summary.cancelledCount} totales`}
                href="/orders"
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

            {/* ── Inteligencia — independiente del período ── */}
            <div className="mt-2">
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ color: 'var(--muted)' }}
              >
                Inteligencia de negocio
              </p>
              <div className="flex flex-col gap-4">
                <StockAlertsList alerts={stockAlerts} />
                <WeeklyChart     days={weeklyDays}    />
                <CoPurchasesCard pairs={coPurchases}  />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}
