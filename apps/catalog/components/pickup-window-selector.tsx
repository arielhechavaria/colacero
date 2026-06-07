'use client'

import type { PickupWindow } from '../lib/client-api'
import { Button }   from '@/components/ui/button'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge }    from '@/components/ui/badge'
import { CalendarX, MapPin } from 'lucide-react'

interface Props {
  windows:       PickupWindow[]
  selected:      string | null
  onSelect:      (id: string) => void
  onConfirm:     () => Promise<void>
  loading:       boolean
  error?:        string | null
  notes:         string
  onNotesChange: (v: string) => void
  businessSlug:  string
}

function formatDate(iso: string): string {
  // w.date puede venir como "2026-05-23" o "2026-05-23T00:00:00.000Z"
  const datePart = iso.split('T')[0]!
  const [y, m, d] = datePart.split('-').map(Number)
  // Construir con hora local (no UTC) para evitar off-by-one de timezone
  const date = new Date(y!, m! - 1, d!)
  return date.toLocaleDateString('es', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
}

export function PickupWindowSelector({ windows, selected, onSelect, onConfirm, loading, error, notes, onNotesChange, businessSlug }: Props) {
  // Solo ventanas de hoy en adelante, máximo 14
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingWindows = windows
    .filter((w) => {
      const [y, m, d] = w.date.split('T')[0]!.split('-').map(Number)
      return new Date(y!, m! - 1, d!) >= today
    })
    .slice(0, 14)

  if (upcomingWindows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CalendarX className="h-12 w-12 text-slate-600" strokeWidth={1.25} />
        <div className="flex flex-col gap-1">
          <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>
            No hay horarios de entrega disponibles
          </p>
          <p className="text-sm max-w-xs mx-auto" style={{ color: 'var(--muted)' }}>
            Este negocio no tiene ventanas de recogida configuradas por el momento.
            Podés volver más tarde o contactar directamente.
          </p>
        </div>

        <div className="flex flex-col gap-2 w-full max-w-xs">
          <a
            href={`https://t.me/${businessSlug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              variant="outline"
              className="w-full"
            >
              ✈️ Contactar por Telegram
            </Button>
          </a>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            style={{ color: 'var(--muted)' }}
          >
            ← Volver al catálogo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        Elegí cuándo querés recoger tu pedido:
      </p>

      <div className="flex flex-col gap-2 max-h-[55vh] overflow-y-auto pr-1">
        {upcomingWindows.map((w) => (
          <label
            key={w.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors"
            style={
              selected === w.id
                ? { backgroundColor: 'var(--primary-dim)', borderColor: 'var(--primary)' }
                : { backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }
            }
          >
            <input
              type="radio"
              name="window"
              value={w.id}
              checked={selected === w.id}
              onChange={() => onSelect(w.id)}
              className="accent-[var(--primary)]"
            />
            <div className="flex-1">
              <p className="font-medium capitalize" style={{ color: 'var(--text)' }}>
                {formatDate(w.date)}
              </p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {w.startTime} – {w.endTime}
              </p>
            </div>
            <Badge variant={w.spotsLeft <= 2 ? 'warning' : 'success'}>
              {w.spotsLeft === 1 ? 'Último lugar' : `${w.spotsLeft} lugares`}
            </Badge>
          </label>
        ))}
      </div>

      {/* Notas opcionales */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pickup-notes">
          ¿Alguna indicación? <span className="normal-case font-normal opacity-60">(opcional)</span>
        </Label>
        <Textarea
          id="pickup-notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Sin cebolla, alérgico a…"
          rows={2}
          maxLength={500}
          className="resize-none"
        />
      </div>

      {error != null && (
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: 'rgba(255,61,85,0.1)', color: 'var(--error)' }}
        >
          {error}
        </p>
      )}

      <Button
        onClick={() => void onConfirm()}
        disabled={loading || selected === null}
        className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90"
      >
        {loading ? 'Confirmando pedido…' : 'Confirmar pedido'}
      </Button>
    </div>
  )
}
