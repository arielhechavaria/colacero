'use client'

import { useEffect, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { getAdminBusinesses, setBusinessStatus, type AdminBusiness, type BusinessStatus } from '../../../lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

const statusLabel: Record<BusinessStatus, string> = {
  ACTIVE:               'Activo',
  PENDING_VERIFICATION: 'Pend. verificación',
  SUSPENDED:            'Suspendido',
}

const statusColor: Record<BusinessStatus, string> = {
  ACTIVE:               'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  PENDING_VERIFICATION: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  SUSPENDED:            'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-CU', { maximumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-CU', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([])
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [actionId,   setActionId]   = useState<string | null>(null)

  async function reload() {
    setLoading(true)
    try {
      const data = await getAdminBusinesses()
      setBusinesses(data)
    } catch (err) {
      toast.error('Error al cargar negocios')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void reload() }, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return businesses
    const q = search.toLowerCase()
    return businesses.filter((b) =>
      b.slug.includes(q) ||
      b.name.toLowerCase().includes(q),
    )
  }, [businesses, search])

  async function toggleStatus(b: AdminBusiness) {
    const next: BusinessStatus = b.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED'
    const verb = next === 'SUSPENDED' ? 'suspender' : 'reactivar'
    if (!confirm(`¿Seguro que querés ${verb} a "${b.name}"?`)) return

    setActionId(b.id)
    try {
      await setBusinessStatus(b.id, next)
      toast.success(`"${b.name}" ${next === 'SUSPENDED' ? 'suspendido' : 'reactivado'}`)
      await reload()
    } catch (err) {
      toast.error(`Error al cambiar status`)
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Negocios ({businesses.length})
          </h2>
          <p className="text-sm text-slate-500">
            Gestionar negocios activos en la plataforma.
          </p>
        </div>
        <div className="w-64">
          <Input
            type="search"
            placeholder="Buscar por slug o nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500">No hay negocios que coincidan.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/[0.08] shadow-lg">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-white/[0.08]">
                <th className="px-4 py-3">Negocio</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Productos</th>
                <th className="px-4 py-3 text-right">Órdenes</th>
                <th className="px-4 py-3 text-right">Ingresos</th>
                <th className="px-4 py-3">Última orden</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-t border-white/[0.08]">
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white">{b.name}</span>
                      <a
                        href={`https://${b.slug}.colacero.com`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs hover:underline text-slate-500"
                      >
                        {b.slug}.colacero.com ↗
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusColor[b.status]}>{statusLabel[b.status]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.stats.productsCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{b.stats.ordersCount}</td>
                  <td className="px-4 py-3 text-right tabular-nums">${formatCurrency(b.stats.totalRevenue)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(b.stats.lastOrderAt)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(b.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant={b.status === 'SUSPENDED' ? 'default' : 'destructive'}
                      size="sm"
                      disabled={actionId === b.id}
                      onClick={() => void toggleStatus(b)}
                    >
                      {actionId === b.id
                        ? '…'
                        : b.status === 'SUSPENDED' ? 'Reactivar' : 'Suspender'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}