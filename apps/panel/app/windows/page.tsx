'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  getWindows, createWindow, patchWindow, deleteWindow, generateTomorrow,
  type PickupWindow, type CreateWindowInput,
} from '../../lib/api'

function groupByDate(windows: PickupWindow[]): Record<string, PickupWindow[]> {
  return windows.reduce<Record<string, PickupWindow[]>>((acc, w) => {
    if (!acc[w.date]) acc[w.date] = []
    acc[w.date]!.push(w)
    return acc
  }, {})
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-CU', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
}

function todayStr(): string {
  return new Date().toLocaleDateString('en-CA')
}

const EMPTY_FORM: CreateWindowInput = {
  date:      todayStr(),
  startTime: '10:00',
  endTime:   '12:00',
  capacity:  10,
  isOpen:    true,
}

const inputStyle = {
  backgroundColor: 'var(--surface)',
  borderColor:     'var(--border)',
  color:           'var(--text)',
} as const

export default function WindowsPage() {
  const router   = useRouter()
  const tokenRef = useRef<string | null>(null)

  const [windows,    setWindows]    = useState<PickupWindow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [success,    setSuccess]    = useState<string | null>(null)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState<CreateWindowInput>(EMPTY_FORM)

  const fetchWindows = useCallback(async () => {
    const token = tokenRef.current
    if (!token) return
    try {
      const data = await getWindows(token)
      setWindows(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar ventanas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
    void fetchWindows()
  }, [fetchWindows, router])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const token = tokenRef.current
    if (!token) return
    setSaving(true)
    setError(null)
    try {
      const created = await createWindow(token, form)
      setWindows((prev) => [...prev, created].sort((a, b) =>
        a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
      ))
      setShowForm(false)
      setForm({ ...EMPTY_FORM, date: todayStr() })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear ventana')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(w: PickupWindow) {
    const token = tokenRef.current
    if (!token) return
    try {
      const updated = await patchWindow(token, w.id, { isOpen: !w.isOpen })
      setWindows((prev) => prev.map((x) => x.id === w.id ? updated : x))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar ventana')
    }
  }

  async function handleGenerate() {
    const token = tokenRef.current
    if (!token) return
    setGenerating(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await generateTomorrow(token)
      setWindows((prev) => [...prev, ...result.created].sort((a, b) =>
        a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
      ))
      setSuccess(`✅ ${result.created.length} ventana${result.created.length > 1 ? 's' : ''} creada${result.created.length > 1 ? 's' : ''} para mañana (${result.date})`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar ventanas')
    } finally {
      setGenerating(false)
    }
  }

  async function handleDelete(w: PickupWindow) {
    if (!confirm(`¿Eliminar ventana ${w.startTime}–${w.endTime}?`)) return
    const token = tokenRef.current
    if (!token) return
    try {
      await deleteWindow(token, w.id)
      setWindows((prev) => prev.filter((x) => x.id !== w.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar ventana')
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p style={{ color: 'var(--muted)' }}>Cargando ventanas…</p>
      </main>
    )
  }

  const grouped = groupByDate(windows)

  return (
    <main className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b px-6 py-4"
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-lg font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
            >
              Ventanas de recogida
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Configurá los horarios de entrega
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void handleGenerate()}
              disabled={generating}
              className="rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid var(--border-glow)' }}
            >
              {generating ? '…' : '📅 Generar mañana'}
            </button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-xl px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: 'var(--primary)', color: '#07080A' }}
            >
              {showForm ? 'Cancelar' : '+ Nueva'}
            </button>
          </div>
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-4">
        {error != null && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: 'rgba(255,61,85,0.08)', color: 'var(--error)', border: '1px solid rgba(255,61,85,0.2)' }}
          >
            {error}
          </div>
        )}
        {success != null && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{ backgroundColor: 'rgba(0,214,143,0.1)', color: 'var(--success)', border: '1px solid rgba(0,214,143,0.25)' }}
          >
            {success}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <form
            onSubmit={(e) => void handleCreate(e)}
            className="rounded-2xl border p-5 flex flex-col gap-3"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <p
              className="font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
            >
              Nueva ventana
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Desde
                </label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Hasta
                </label>
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                  Capacidad (pedidos)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value, 10) }))}
                  className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary)', color: '#07080A' }}
            >
              {saving ? 'Creando…' : 'Crear ventana'}
            </button>
          </form>
        )}

        {/* Windows grouped by date */}
        {Object.keys(grouped).length === 0 ? (
          <div
            className="rounded-2xl border p-10 text-center"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <p style={{ color: 'var(--muted)' }}>No hay ventanas configuradas</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm underline"
              style={{ color: 'var(--primary)' }}
            >
              Crear la primera
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([date, wins]) => (
            <section
              key={date}
              className="rounded-2xl border p-4"
              style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <p
                className="mb-3 text-sm font-semibold capitalize"
                style={{ color: 'var(--muted)' }}
              >
                {formatDate(date)}
              </p>
              <div className="flex flex-col gap-2">
                {wins.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center justify-between rounded-xl border px-4 py-3"
                    style={{
                      backgroundColor: 'var(--surface)',
                      borderColor:     'var(--border)',
                      opacity:         w.isOpen ? 1 : 0.55,
                    }}
                  >
                    <div>
                      <p
                        className="font-medium"
                        style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}
                      >
                        {w.startTime} – {w.endTime}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                        {w.ordersCount}/{w.capacity} pedidos
                        {!w.isOpen && <span className="ml-2">· cerrada</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void handleToggle(w)}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                        style={
                          w.isOpen
                            ? { backgroundColor: 'rgba(255,176,32,0.12)', color: 'var(--warning)' }
                            : { backgroundColor: 'rgba(0,214,143,0.12)', color: 'var(--success)' }
                        }
                      >
                        {w.isOpen ? 'Cerrar' : 'Abrir'}
                      </button>
                      {w.ordersCount === 0 && (
                        <button
                          onClick={() => void handleDelete(w)}
                          className="rounded-xl px-3 py-1.5 text-xs font-semibold"
                          style={{ backgroundColor: 'rgba(255,61,85,0.1)', color: 'var(--error)' }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  )
}
