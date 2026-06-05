'use client'

import { useMemo, useState } from 'react'
import { CalendarIcon, ChevronDown } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfWeek } from 'date-fns'
import { es } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import type { StatsPeriod, StatsRange } from '../lib/api'

// ─── Presets ────────────────────────────────────────────────────────────────

interface Preset {
  key:    Exclude<StatsPeriod, 'custom'>
  label:  string
}

const PRESETS: Preset[] = [
  { key: 'today',     label: 'Hoy'              },
  { key: 'yesterday', label: 'Ayer'             },
  { key: 'last7',     label: 'Últimos 7 días'   },
  { key: 'last30',    label: 'Últimos 30 días'  },
  { key: 'week',      label: 'Esta semana'      },
  { key: 'month',     label: 'Este mes'         },
  { key: 'lastMonth', label: 'Mes pasado'       },
]

// ─── Helper: rango efectivo del preset (para mostrar el label) ──────────────

function getPresetRange(key: Exclude<StatsPeriod, 'custom'>): { start: Date; end: Date } {
  const now = new Date()
  switch (key) {
    case 'today':     return { start: now, end: now }
    case 'yesterday': { const y = subDays(now, 1); return { start: y, end: y } }
    case 'last7':     return { start: subDays(now, 6),  end: now }
    case 'last30':    return { start: subDays(now, 29), end: now }
    case 'week':      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: now }
    case 'month':     return { start: startOfMonth(now), end: now }
    case 'lastMonth': {
      const lm = subMonths(now, 1)
      return { start: startOfMonth(lm), end: endOfMonth(lm) }
    }
  }
}

function formatRangeLabel(start: Date, end: Date): string {
  const sameDay  = format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')
  const sameYear = start.getFullYear() === end.getFullYear()
  if (sameDay) return format(start, "d 'de' MMM yyyy", { locale: es })
  if (sameYear) {
    return `${format(start, 'd MMM', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })}`
  }
  return `${format(start, 'd MMM yyyy', { locale: es })} – ${format(end, 'd MMM yyyy', { locale: es })}`
}

// ─── Component ──────────────────────────────────────────────────────────────

interface Props {
  range:    StatsRange
  onChange: (next: StatsRange) => void
}

export function PeriodSelector({ range, onChange }: Props) {
  const [open, setOpen]               = useState(false)
  const [customRange, setCustomRange] = useState<DateRange | undefined>(() => {
    if (range.period === 'custom' && range.start && range.end) {
      return { from: new Date(`${range.start}T00:00:00`), to: new Date(`${range.end}T00:00:00`) }
    }
    return undefined
  })

  // Label visible en el botón trigger
  const triggerLabel = useMemo(() => {
    if (range.period === 'custom' && range.start && range.end) {
      const s = new Date(`${range.start}T00:00:00`)
      const e = new Date(`${range.end}T00:00:00`)
      return formatRangeLabel(s, e)
    }
    const preset = PRESETS.find((p) => p.key === range.period)
    return preset?.label ?? 'Hoy'
  }, [range])

  function selectPreset(key: Exclude<StatsPeriod, 'custom'>) {
    onChange({ period: key })
    setCustomRange(undefined)
    setOpen(false)
  }

  function applyCustom() {
    if (customRange?.from && customRange.to) {
      onChange({
        period: 'custom',
        start:  format(customRange.from, 'yyyy-MM-dd'),
        end:    format(customRange.to,   'yyyy-MM-dd'),
      })
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>{triggerLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="flex flex-col sm:flex-row p-0 overflow-hidden bg-[#111827] border border-white/[0.10] shadow-2xl"
      >
        {/* Sidebar de presets */}
        <div className="flex flex-col p-2 sm:w-44 border-r border-white/[0.08]" style={{ minWidth: 176 }}>
          <p className="text-[10px] font-bold uppercase tracking-widest px-2 pb-2 text-slate-500">
            Atajos
          </p>
          {PRESETS.map((p) => {
            const isActive = range.period === p.key
            return (
              <button
                key={p.key}
                onClick={() => selectPreset(p.key)}
                className={cn(
                  'text-left text-sm rounded-lg px-3 py-2 transition-colors',
                  isActive
                    ? 'font-semibold bg-indigo-500/15 text-indigo-400'
                    : 'text-slate-300 hover:bg-[#0B0F1A]',
                )}
              >
                {p.label}
              </button>
            )
          })}
        </div>

        {/* Calendar range picker */}
        <div className="flex flex-col">
          <Calendar
            mode="range"
            selected={customRange}
            onSelect={setCustomRange}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
            locale={es}
          />
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-white/[0.08]">
            <p className="text-xs text-slate-500">
              {customRange?.from && customRange.to
                ? formatRangeLabel(customRange.from, customRange.to)
                : 'Seleccioná un rango'}
            </p>
            <Button
              size="sm"
              disabled={!customRange?.from || !customRange.to}
              onClick={applyCustom}
            >
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
