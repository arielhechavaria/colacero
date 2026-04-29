'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  getWindows, createWindow, patchWindow, deleteWindow,
  type PickupWindow, type CreateWindowInput,
} from '../../lib/api'

// Group windows by date
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

// Today in YYYY-MM-DD
function todayStr(): string {
  return new Date().toLocaleDateString('en-CA') // returns YYYY-MM-DD
}

const EMPTY_FORM: CreateWindowInput = {
  date:      todayStr(),
  startTime: '10:00',
  endTime:   '12:00',
  capacity:  10,
  isOpen:    true,
}

export default function WindowsPage() {
  const router   = useRouter()
  const tokenRef = useRef<string | null>(null)

  const [windows,    setWindows]    = useState<PickupWindow[]>([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [showForm,   setShowForm]   = useState(false)
  const [form,       setForm]       = useState<CreateWindowInput>(EMPTY_FORM)

  // ── Auth + load ─────────────────────────────────────────────────────────────
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

  // ── Create ──────────────────────────────────────────────────────────────────
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

  // ── Toggle open/closed ───────────────────────────────────────────────────────
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

  // ── Delete ───────────────────────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-gray-400">Cargando ventanas…</p>
      </main>
    )
  }

  const grouped = groupByDate(windows)

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-teal-700 px-4 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">🕐 Ventanas de recogida</h1>
            <p className="text-sm text-teal-200">Configurá los horarios de entrega</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/orders')}
              className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold hover:bg-teal-500"
            >
              ← Pedidos
            </button>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-50"
            >
              {showForm ? 'Cancelar' : '+ Nueva'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-4">

        {error != null && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {/* Create form */}
        {showForm && (
          <form
            onSubmit={(e) => void handleCreate(e)}
            className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-3"
          >
            <p className="font-semibold text-gray-900">Nueva ventana</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Fecha</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Desde</label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Hasta</label>
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-gray-600">Capacidad (pedidos)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value, 10) }))}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-teal-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Creando…' : 'Crear ventana'}
            </button>
          </form>
        )}

        {/* Windows list grouped by date */}
        {Object.keys(grouped).length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-gray-400">No hay ventanas configuradas</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 text-sm text-teal-700 underline"
            >
              Crear la primera
            </button>
          </div>
        ) : (
          Object.entries(grouped).map(([date, wins]) => (
            <section key={date} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold capitalize text-gray-500">
                {formatDate(date)}
              </p>
              <div className="flex flex-col gap-2">
                {wins.map((w) => (
                  <div
                    key={w.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                      w.isOpen ? 'border-gray-200 bg-gray-50' : 'border-gray-100 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {w.startTime} – {w.endTime}
                      </p>
                      <p className="text-xs text-gray-500">
                        {w.ordersCount}/{w.capacity} pedidos
                        {!w.isOpen && <span className="ml-2 text-gray-400">· cerrada</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Toggle open/closed */}
                      <button
                        onClick={() => void handleToggle(w)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                          w.isOpen
                            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {w.isOpen ? 'Cerrar' : 'Abrir'}
                      </button>
                      {/* Delete (solo si no hay órdenes) */}
                      {w.ordersCount === 0 && (
                        <button
                          onClick={() => void handleDelete(w)}
                          className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-100"
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

        {/* Logout */}
        <button
          onClick={() => { sessionStorage.removeItem('panel_token'); router.push('/login') }}
          className="mt-2 w-full rounded-xl border border-gray-300 py-2 text-sm text-gray-500 hover:bg-gray-50"
        >
          Cerrar sesión
        </button>

      </div>
    </main>
  )
}
