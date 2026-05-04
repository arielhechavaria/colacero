'use client'

import type { PickupWindow } from '../lib/client-api'
import { Button }   from '@/components/ui/button'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge }    from '@/components/ui/badge'

interface Props {
  windows:       PickupWindow[]
  selected:      string | null
  onSelect:      (id: string) => void
  onConfirm:     () => Promise<void>
  loading:       boolean
  error?:        string | null
  notes:         string
  onNotesChange: (v: string) => void
}

// Textarea needs to be created for catalog too
function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('es-CU', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
}

export function PickupWindowSelector({ windows, selected, onSelect, onConfirm, loading, error, notes, onNotesChange }: Props) {
  if (windows.length === 0) {
    return (
      <p className="py-8 text-center" style={{ color: 'var(--muted)' }}>
        No hay ventanas de recogida disponibles por el momento.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        Elegí cuándo querés recoger tu pedido:
      </p>

      <div className="flex flex-col gap-2">
        {windows.map((w) => (
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
