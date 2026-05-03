'use client'

import type { PickupWindow } from '../lib/client-api'

interface Props {
  windows:    PickupWindow[]
  selected:   string | null
  onSelect:   (id: string) => void
  onConfirm:  () => Promise<void>
  loading:    boolean
  error?:     string | null
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('es-CU', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
  })
}

export function PickupWindowSelector({ windows, selected, onSelect, onConfirm, loading, error }: Props) {
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
            <span
              className="text-xs font-medium"
              style={{ color: w.spotsLeft <= 2 ? 'var(--warning)' : 'var(--success)' }}
            >
              {w.spotsLeft === 1 ? 'Último lugar' : `${w.spotsLeft} lugares`}
            </span>
          </label>
        ))}
      </div>

      {error != null && (
        <p
          className="rounded-lg px-3 py-2 text-sm"
          style={{ backgroundColor: 'rgba(255,61,85,0.1)', color: 'var(--error)' }}
        >
          {error}
        </p>
      )}

      <button
        onClick={() => void onConfirm()}
        disabled={loading || selected === null}
        className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50 bg-gradient-teal-violet shadow-glow"
      >
        {loading ? 'Confirmando pedido…' : 'Confirmar pedido'}
      </button>
    </div>
  )
}
