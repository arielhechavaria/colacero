'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getCustomers,
  type CustomerSegment,
  type CustomerSummary, isAuthenticatedClient, } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'
import { Input }  from '@/components/ui/input'

// ── Segment tabs ──────────────────────────────────────────────────────────────

const SEGMENTS: { key: CustomerSegment; label: string; icon: string }[] = [
  { key: 'all',    label: 'Todos',   icon: '👥' },
  { key: 'active', label: 'Activos', icon: '🟢' },
  { key: 'vip',    label: 'VIP',     icon: '⭐' },
]

// ── Customer card ─────────────────────────────────────────────────────────────

function CustomerCard({ c }: { c: CustomerSummary }) {
  const name     = c.displayName ?? c.phone ?? c.telegramId ?? 'Cliente anónimo'
  const contact  = c.phone ?? (c.telegramId ? `TG: ${c.telegramId}` : null)
  const lastDate = c.lastOrderAt
    ? new Date(c.lastOrderAt).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Sin pedidos'

  return (
    <Link href={`/customers/${c.id}`}>
      <div className="glass rounded-2xl p-4 flex items-center gap-4 hover:scale-[1.01] transition-transform cursor-pointer">
        {/* Avatar */}
        <div
          className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-teal-violet"
        >
          {name.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{name}</p>
            {c.isVip && <Badge variant="secondary" className="flex-shrink-0 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">VIP ⭐</Badge>}
            {c.isActive && !c.isVip && <Badge variant="default" className="flex-shrink-0">activo</Badge>}
          </div>
          {contact && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{contact}</p>
          )}
        </div>

        {/* Stats */}
        <div className="flex-shrink-0 text-right">
          <p className="text-sm font-bold font-mono text-gradient">
            ${c.totalSpent.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            {c.totalOrders} pedido{c.totalOrders !== 1 ? 's' : ''}
          </p>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>{lastDate}</p>
        </div>
      </div>
    </Link>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const router = useRouter()

  const [segment,   setSegment]   = useState<CustomerSegment>('all')
  const [search,    setSearch]    = useState('')
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const tokenRef    = useRef<string | null>(null)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = useCallback(async (tok: string, seg: CustomerSegment, q: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getCustomers(tok, seg, q)
      setCustomers(res.items)
      setTotal(res.total)
    } catch {
      setError('Error al cargar clientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = (isAuthenticatedClient() ? '1' : null)
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
    void load(token, segment, search)
  }, [load, router, segment]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced search
  function handleSearch(value: string) {
    setSearch(value)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      if (tokenRef.current) void load(tokenRef.current, segment, value)
    }, 350)
  }

  function changeSegment(s: CustomerSegment) {
    setSegment(s)
    setSearch('')
    // load triggered by effect
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-10 glass px-6 py-4"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-lg font-bold text-gradient">Clientes</h1>
          <span className="text-xs font-mono" style={{ color: 'var(--muted)' }}>
            {total} cliente{total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Segment tabs */}
        <div className="flex gap-1 mt-3">
          {SEGMENTS.map(({ key, label, icon }) => (
            <Button
              key={key}
              size="sm"
              variant={segment === key ? 'default' : 'ghost'}
              onClick={() => changeSegment(key)}
            >
              {icon} {label}
            </Button>
          ))}
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none" style={{ color: 'var(--muted)' }}>🔍</span>
          <Input
            type="search"
            placeholder="Buscar por nombre o teléfono…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>

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
            <p style={{ color: 'var(--muted)' }}>Cargando clientes…</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <p className="text-2xl mb-2">👥</p>
            <p style={{ color: 'var(--muted)' }}>
              {search ? 'Sin resultados para esa búsqueda' : 'Sin clientes en este segmento'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {customers.map((c) => <CustomerCard key={c.id} c={c} />)}
          </div>
        )}
      </div>
    </main>
  )
}
