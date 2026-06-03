'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getAdminLeads, updateLead, type Lead, type LeadStatus } from '../../../lib/api'
import { Badge } from '@/components/ui/badge'

const statusLabel: Record<LeadStatus, string> = {
  NEW:        'Nuevo',
  CONTACTED:  'Contactado',
  TRIAL:      'En trial',
  CONVERTED:  'Convertido',
  LOST:       'Perdido',
}

const statusColor: Record<LeadStatus, string> = {
  NEW:        'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTED:  'bg-amber-100 text-amber-700 border-amber-200',
  TRIAL:      'bg-violet-100 text-violet-700 border-violet-200',
  CONVERTED:  'bg-emerald-100 text-emerald-700 border-emerald-200',
  LOST:       'bg-slate-100 text-slate-600 border-slate-200',
}

const STATUS_VALUES: LeadStatus[] = ['NEW', 'CONTACTED', 'TRIAL', 'CONVERTED', 'LOST']

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-CU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function downloadCsv(leads: Lead[]) {
  const headers = [
    'id', 'email', 'phone', 'telegram', 'businessKind',
    'message', 'source', 'status', 'notes', 'createdAt', 'updatedAt',
  ]
  const rows = leads.map((l) => headers.map((h) => csvEscape((l as unknown as Record<string, unknown>)[h])))
  const csv  = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function AdminLeadsPage() {
  const [leads,   setLeads]   = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState<LeadStatus | 'ALL'>('ALL')

  async function reload() {
    setLoading(true)
    try {
      setLeads(await getAdminLeads())
    } catch {
      toast.error('Error al cargar leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void reload() }, [])

  async function changeStatus(lead: Lead, status: LeadStatus) {
    try {
      await updateLead(lead.id, { status })
      toast.success(`Lead marcado como ${statusLabel[status]}`)
      await reload()
    } catch {
      toast.error('Error al actualizar')
    }
  }

  const filtered = filter === 'ALL' ? leads : leads.filter((l) => l.status === filter)

  const stats = leads.reduce<Record<LeadStatus, number>>((acc, l) => {
    acc[l.status] = (acc[l.status] ?? 0) + 1
    return acc
  }, { NEW: 0, CONTACTED: 0, TRIAL: 0, CONVERTED: 0, LOST: 0 })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Leads ({leads.length})
          </h2>
          <p className="text-sm text-slate-500">
            Interesados que dejaron sus datos en la landing o página de contacto.
          </p>
        </div>
        {leads.length > 0 && (
          <button
            onClick={() => downloadCsv(filtered)}
            className="rounded-xl px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ↓ Exportar CSV{filter !== 'ALL' ? ` (${filter})` : ''}
          </button>
        )}
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter('ALL')}
          className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
            filter === 'ALL'
              ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
          }`}
        >
          Todos ({leads.length})
        </button>
        {STATUS_VALUES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
              filter === s
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            {statusLabel[s]} ({stats[s]})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-500">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold text-slate-900">Sin leads en este filtro</p>
          <p className="text-sm mt-1 text-slate-500">
            Cuando alguien complete el form de contacto, va a aparecer acá.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <div
              key={lead.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    <a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a>
                  </p>
                  <p className="text-xs mt-1 text-slate-500">
                    {lead.telegram && <>Telegram: <span className="font-medium">{lead.telegram}</span> · </>}
                    {lead.businessKind && <>Negocio: <span className="font-medium">{lead.businessKind}</span> · </>}
                    {formatDate(lead.createdAt)} · {lead.source}
                  </p>
                </div>
                <Badge className={statusColor[lead.status]}>{statusLabel[lead.status]}</Badge>
              </div>

              {lead.message && (
                <p className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-600">
                  {lead.message}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {STATUS_VALUES.map((s) => (
                  <button
                    key={s}
                    onClick={() => void changeStatus(lead, s)}
                    disabled={lead.status === s}
                    className={`rounded-lg px-3 py-1 text-xs font-medium border transition-all disabled:opacity-40 ${
                      lead.status === s
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700'
                    }`}
                  >
                    → {statusLabel[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
