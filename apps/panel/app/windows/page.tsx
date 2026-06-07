'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  getWindows, createWindow, patchWindow, deleteWindow,
  generateTomorrow, generateDefaultSchedule,
  type PickupWindow, type CreateWindowInput, isAuthenticatedClient,
} from '../../lib/api'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Skeleton } from '@/components/ui/skeleton'

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toLocaleDateString('en-CA')
}

function toDate(iso: string): Date {
  return new Date(iso + 'T12:00:00')
}

function occupancyColor(count: number, capacity: number): string {
  if (capacity === 0) return 'text-slate-500'
  const pct = count / capacity
  if (pct >= 1)   return 'text-red-400'
  if (pct >= 0.7) return 'text-amber-400'
  return 'text-emerald-400'
}

// ── WindowRow ─────────────────────────────────────────────────────────────────

function WindowRow({
  w,
  onToggle,
  onDelete,
}: {
  w: PickupWindow
  onToggle: (w: PickupWindow) => Promise<void>
  onDelete: (w: PickupWindow) => Promise<void>
}) {
  const pct      = w.capacity > 0 ? w.ordersCount / w.capacity : 0
  const barWidth = `${Math.min(pct * 100, 100)}%`
  const barColor = pct >= 1 ? 'bg-red-400' : pct >= 0.7 ? 'bg-amber-400' : 'bg-indigo-400'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 transition-opacity ${!w.isOpen ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Time */}
          <p className="font-mono font-bold text-white text-base">
            {w.startTime} – {w.endTime}
            {!w.isOpen && <span className="ml-2 text-xs font-sans font-normal text-slate-500">cerrada</span>}
          </p>

          {/* Occupancy bar */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: barWidth }}
              />
            </div>
            <span className={`text-[11px] font-mono font-semibold flex-shrink-0 ${occupancyColor(w.ordersCount, w.capacity)}`}>
              {w.ordersCount}/{w.capacity}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Button
            variant={w.isOpen ? 'warning' : 'success'}
            size="sm"
            onClick={() => void onToggle(w)}
            className="text-xs"
          >
            {w.isOpen ? 'Cerrar' : 'Abrir'}
          </Button>
          {w.ordersCount === 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void onDelete(w)}
              className="text-xs"
            >
              ×
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WindowsPage() {
  const router   = useRouter()
  const tokenRef = useRef<string | null>(null)

  const [windows,             setWindows]             = useState<PickupWindow[]>([])
  const [loading,             setLoading]             = useState(true)
  const [saving,              setSaving]              = useState(false)
  const [generating,          setGenerating]          = useState(false)
  const [generatingSchedule,  setGeneratingSchedule]  = useState(false)
  const [selectedDate,        setSelectedDate]        = useState<string>(todayStr())
  const [showForm,            setShowForm]            = useState(false)
  const [form,                setForm]                = useState({ startTime: '08:00', endTime: '17:00', capacity: 10 })

  // ── Data loading ─────────────────────────────────────────────────────────

  const fetchWindows = useCallback(async () => {
    const token = tokenRef.current
    if (!token) return
    try {
      const data = await getWindows(token)
      setWindows(data)
    } catch {
      toast.error('Error al cargar ventanas')
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

  // ── Derived state ─────────────────────────────────────────────────────────

  const daysWithWindows = useMemo(
    () => Array.from(new Set(windows.map(w => w.date))).map(d => toDate(d)),
    [windows],
  )

  const dayWindows = useMemo(
    () => windows
      .filter(w => w.date === selectedDate)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [windows, selectedDate],
  )

  const totalThisMonth = useMemo(() => {
    const prefix = selectedDate.slice(0, 7) // "2026-06"
    return windows.filter(w => w.date.startsWith(prefix)).length
  }, [windows, selectedDate])

  // ── Handlers ─────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const token = tokenRef.current
    if (!token) return
    setSaving(true)
    try {
      const input: CreateWindowInput = { date: selectedDate, ...form, isOpen: true }
      const created = await createWindow(token, input)
      setWindows(prev => [...prev, created].sort((a, b) =>
        a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date),
      ))
      setShowForm(false)
      toast.success('Ventana creada')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(w: PickupWindow) {
    const token = tokenRef.current
    if (!token) return
    try {
      const updated = await patchWindow(token, w.id, { isOpen: !w.isOpen })
      setWindows(prev => prev.map(x => x.id === w.id ? updated : x))
    } catch {
      toast.error('Error al actualizar')
    }
  }

  async function handleDelete(w: PickupWindow) {
    if (!confirm(`¿Eliminar ventana ${w.startTime}–${w.endTime}?`)) return
    const token = tokenRef.current
    if (!token) return
    try {
      await deleteWindow(token, w.id)
      setWindows(prev => prev.filter(x => x.id !== w.id))
      toast.success('Ventana eliminada')
    } catch {
      toast.error('Error al eliminar')
    }
  }

  async function handleGenerate() {
    const token = tokenRef.current
    if (!token) return
    setGenerating(true)
    try {
      const result = await generateTomorrow(token)
      setWindows(prev => [...prev, ...result.created].sort((a, b) =>
        a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date),
      ))
      toast.success(`${result.created.length} ventana${result.created.length > 1 ? 's' : ''} creada${result.created.length > 1 ? 's' : ''} para mañana`)
    } catch {
      toast.error('Error al generar')
    } finally {
      setGenerating(false)
    }
  }

  async function handleGenerateSchedule() {
    setGeneratingSchedule(true)
    try {
      const result = await generateDefaultSchedule()
      setWindows(prev => [...prev, ...result.created].sort((a, b) =>
        a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date),
      ))
      const n = result.created.length
      toast.success(n > 0
        ? `${n} ventana${n > 1 ? 's' : ''} L-V creada${n > 1 ? 's' : ''}`
        : 'Todos los días L-V ya tienen ventana',
      )
    } catch {
      toast.error('Error al generar horario')
    } finally {
      setGeneratingSchedule(false)
    }
  }

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="sticky top-0 z-10 h-[73px] border-b border-white/[0.08] bg-[#0B0F1A]" />
        <div className="grid lg:grid-cols-[300px_1fr]">
          <div className="p-4 border-r border-white/[0.08]">
            <Skeleton className="h-[280px] w-full rounded-xl" />
          </div>
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        </div>
      </main>
    )
  }

  const selectedDateObj = toDate(selectedDate)
  const selectedLabel   = format(selectedDateObj, "EEEE d 'de' MMMM", { locale: es })

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <main className="min-h-screen flex flex-col">

      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 border-b border-white/[0.08] bg-[#0B0F1A]">
        <div>
          <h1 className="text-lg font-bold text-gradient">Ventanas de recogida</h1>
          <p className="text-xs text-slate-500">{windows.length} ventanas en total</p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" size="sm" onClick={() => void handleGenerateSchedule()} disabled={generatingSchedule}>
            {generatingSchedule ? '…' : '📆 L-V (30 días)'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleGenerate()} disabled={generating}>
            {generating ? '…' : '📅 Mañana'}
          </Button>
        </div>
      </header>

      {/* Split layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-[300px_1fr] flex-1 lg:h-[calc(100vh-73px)] overflow-hidden">

        {/* ── LEFT: Calendar ── */}
        <div className="border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#0C1220] flex flex-col lg:overflow-y-auto">
          <div className="p-2">
            <Calendar
              mode="single"
              selected={selectedDateObj}
              onSelect={(d) => { if (d) { setSelectedDate(format(d, 'yyyy-MM-dd')); setShowForm(false) } }}
              locale={es}
              modifiers={{ hasWindows: daysWithWindows }}
              modifiersClassNames={{ hasWindows: 'day-has-windows' }}
              className="w-full"
            />
          </div>

          {/* Legend + stats */}
          <div className="px-4 pb-4 space-y-2 border-t border-white/[0.06] pt-3 mt-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-400" />
              Día con ventanas configuradas
            </div>
            <p className="text-xs text-slate-600">
              {totalThisMonth} ventana{totalThisMonth !== 1 ? 's' : ''} en {format(selectedDateObj, 'MMMM', { locale: es })}
            </p>
          </div>
        </div>

        {/* ── RIGHT: Day detail ── */}
        <div className="flex flex-col flex-1 lg:overflow-y-auto">
          {/* Day header */}
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 border-b border-white/[0.06] bg-[#0B0F1A]">
            <div>
              <h2 className="text-base font-bold text-white capitalize">{selectedLabel}</h2>
              <p className="text-xs text-slate-500">
                {dayWindows.length === 0
                  ? 'Sin ventanas'
                  : `${dayWindows.length} ventana${dayWindows.length > 1 ? 's' : ''} · ${dayWindows.reduce((s, w) => s + w.capacity, 0)} cupos totales`
                }
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowForm(v => !v)}
              className={showForm ? '' : 'bg-gradient-teal-violet shadow-glow hover:opacity-90'}
              variant={showForm ? 'outline' : 'default'}
            >
              {showForm ? 'Cancelar' : '+ Nueva ventana'}
            </Button>
          </div>

          <div className="px-5 py-4 flex flex-col gap-3">

            {/* Create form */}
            <AnimatePresence>
              {showForm && (
                <motion.form
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={(e) => void handleCreate(e)}
                  className="rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] p-4 flex flex-col gap-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Nueva ventana para el {format(selectedDateObj, "d 'de' MMMM", { locale: es })}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="win-start" className="text-xs">Desde</Label>
                      <Input
                        id="win-start" type="time" required
                        value={form.startTime}
                        onChange={(e) => setForm(f => ({ ...f, startTime: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="win-end" className="text-xs">Hasta</Label>
                      <Input
                        id="win-end" type="time" required
                        value={form.endTime}
                        onChange={(e) => setForm(f => ({ ...f, endTime: e.target.value }))}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label htmlFor="win-cap" className="text-xs">Cupos</Label>
                      <Input
                        id="win-cap" type="number" required min={1}
                        value={form.capacity}
                        onChange={(e) => setForm(f => ({ ...f, capacity: parseInt(e.target.value, 10) }))}
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={saving} className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90">
                    {saving ? 'Creando…' : 'Crear ventana'}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Windows list */}
            {dayWindows.length === 0 && !showForm ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <span className="text-4xl opacity-40">🕐</span>
                <p className="font-semibold text-slate-400">Sin ventanas para este día</p>
                <p className="text-sm text-slate-600 max-w-xs">
                  Podés crear una manualmente o usar el botón "+ Nueva ventana".
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {dayWindows.map(w => (
                  <WindowRow key={w.id} w={w} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
