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
      <p className="py-8 text-center text-gray-400">
        No hay ventanas de recogida disponibles por el momento.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        Elegí cuándo querés recoger tu pedido:
      </p>

      <div className="flex flex-col gap-2">
        {windows.map((w) => (
          <label
            key={w.id}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors ${
              selected === w.id
                ? 'border-teal-600 bg-teal-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <input
              type="radio"
              name="window"
              value={w.id}
              checked={selected === w.id}
              onChange={() => onSelect(w.id)}
              className="accent-teal-600"
            />
            <div className="flex-1">
              <p className="font-medium capitalize text-gray-900">
                {formatDate(w.date)}
              </p>
              <p className="text-sm text-gray-500">
                {w.startTime} – {w.endTime}
              </p>
            </div>
            <span
              className={`text-xs font-medium ${
                w.spotsLeft <= 2 ? 'text-amber-500' : 'text-emerald-600'
              }`}
            >
              {w.spotsLeft === 1 ? 'Último lugar' : `${w.spotsLeft} lugares`}
            </span>
          </label>
        ))}
      </div>

      {error != null && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        onClick={() => void onConfirm()}
        disabled={loading || selected === null}
        className="w-full rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Confirmando pedido…' : 'Confirmar pedido'}
      </button>
    </div>
  )
}
