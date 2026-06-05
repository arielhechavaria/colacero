'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getWindows, createWindow, patchWindow, deleteWindow, generateTomorrow, generateDefaultSchedule,
  type PickupWindow, type CreateWindowInput, isAuthenticatedClient, } from '../../lib/api'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

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


export default function WindowsPage() {
  const router   = useRouter()
  const tokenRef = useRef<string | null>(null)

  const [windows,           setWindows]          = useState<PickupWindow[]>([])
  const [loading,           setLoading]          = useState(true)
  const [saving,            setSaving]           = useState(false)
  const [generating,        setGenerating]       = useState(false)
  const [generatingSchedule, setGeneratingSchedule] = useState(false)
  const [error,             setError]            = useState<string | null>(null)
  const [success,           setSuccess]          = useState<string | null>(null)
  const [showForm,          setShowForm]         = useState(false)
  const [form,              setForm]             = useState<CreateWindowInput>(EMPTY_FORM)

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
    const token = (isAuthenticatedClient() ? '1' : null)
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

  async function handleGenerateSchedule() {
    if (!tokenRef.current) return
    setGeneratingSchedule(true)
    setError(null)
    setSuccess(null)
    try {
      const result = await generateDefaultSchedule()
      setWindows((prev) => [...prev, ...result.created].sort((a, b) =>
        a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)
      ))
      const n = result.created.length
      const s = result.skipped
      setSuccess(
        n > 0
          ? `✅ ${n} ventana${n > 1 ? 's' : ''} creada${n > 1 ? 's' : ''} (L-V, 8:00-17:00)${s > 0 ? ` · ${s} día${s > 1 ? 's' : ''} ya tenía${s > 1 ? 'n' : ''} ventana` : ''}`
          : `ℹ️ Todos los días L-V ya tienen ventana configurada${s > 0 ? ` (${s} días omitidos)` : ''}`,
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar horario')
    } finally {
      setGeneratingSchedule(false)
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
      <main className="min-h-screen px-6 py-8 max-w-5xl mx-auto">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg p-5 flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </main>
    )
  }

  const grouped = groupByDate(windows)

  return (
    <main className="min-h-screen">
      <header
        className="sticky top-0 z-10 px-6 py-5 border-b border-white/[0.08] bg-[#0B0F1A]"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gradient">Ventanas de recogida</h1>
            <p className="text-sm text-slate-500">
              Configurá los horarios de entrega
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => void handleGenerateSchedule()} disabled={generatingSchedule}>
              {generatingSchedule ? '…' : '📆 Generar L-V (30 días)'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => void handleGenerate()} disabled={generating}>
              {generating ? '…' : '📅 Generar mañana'}
            </Button>
            <Button size="sm" className="bg-gradient-teal-violet shadow-glow hover:opacity-90" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancelar' : '+ Nueva'}
            </Button>
          </div>
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-4">
        {error != null && (
          <div
            className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600 border border-red-200"
          >
            {error}
          </div>
        )}
        {success != null && (
          <div
            className="rounded-xl px-4 py-3 text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-200"
          >
            {success}
          </div>
        )}

        {/* Create form */}
        {showForm && (
          <form
            onSubmit={(e) => void handleCreate(e)}
            className="bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg p-5 flex flex-col gap-3"
          >
            <p
              className="font-semibold text-white"
            >
              Nueva ventana
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="win-date">Fecha</Label>
                <Input
                  id="win-date"
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="win-start">Desde</Label>
                <Input
                  id="win-start"
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="win-end">Hasta</Label>
                <Input
                  id="win-end"
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="win-cap">Capacidad (pedidos)</Label>
                <Input
                  id="win-cap"
                  type="number"
                  required
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: parseInt(e.target.value, 10) }))}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90"
            >
              {saving ? 'Creando…' : 'Crear ventana'}
            </Button>
          </form>
        )}

        {/* Windows grouped by date */}
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg p-10 text-center flex flex-col items-center gap-3">
            <span className="text-4xl">📅</span>
            <p className="font-semibold text-white">No hay ventanas configuradas</p>
            <p className="text-sm max-w-xs text-slate-500">
              Sin ventanas, los clientes no pueden confirmar pedidos.
            </p>
            <div className="flex gap-2 flex-wrap justify-center mt-1">
              <Button
                size="sm"
                className="bg-gradient-teal-violet shadow-glow hover:opacity-90"
                onClick={() => void handleGenerateSchedule()}
                disabled={generatingSchedule}
              >
                {generatingSchedule ? '…' : '📆 Generar horario L-V'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowForm(true)}>
                + Crear manualmente
              </Button>
            </div>
          </div>
        ) : (
          Object.entries(grouped).map(([date, wins]) => (
            <section
              key={date}
              className="bg-white/[0.04] rounded-xl border border-white/[0.08] shadow-lg p-4"
            >
              <p
                className="mb-3 text-sm font-semibold capitalize text-slate-500"
              >
                {formatDate(date)}
              </p>
              <div className="flex flex-col gap-2">
                {wins.map((w) => (
                  <div
                    key={w.id}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 bg-[#0B0F1A] border border-white/[0.08] ${w.isOpen ? '' : 'opacity-50'}`}
                  >
                    <div>
                      <p
                        className="font-medium font-mono text-white"
                      >
                        {w.startTime} – {w.endTime}
                      </p>
                      <p className="text-xs mt-0.5 text-slate-500">
                        {w.ordersCount}/{w.capacity} pedidos
                        {!w.isOpen && <span className="ml-2">· cerrada</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={w.isOpen ? 'warning' : 'success'}
                        size="sm"
                        onClick={() => void handleToggle(w)}
                      >
                        {w.isOpen ? 'Cerrar' : 'Abrir'}
                      </Button>
                      {w.ordersCount === 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => void handleDelete(w)}
                        >
                          Eliminar
                        </Button>
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