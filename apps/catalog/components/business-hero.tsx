'use client'

import { useEffect, useState } from 'react'
import type { NextPickupWindow } from '../lib/api'

interface Props {
  name:        string
  description: string | null | undefined
  nextWindow:  NextPickupWindow | null
}

function isOpenNow(window: NextPickupWindow | null): boolean {
  if (!window) return false
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  if (window.date !== todayStr) return false
  const [sh, sm] = window.startTime.split(':').map(Number)
  const [eh, em] = window.endTime.split(':').map(Number)
  const startMin = (sh ?? 0) * 60 + (sm ?? 0)
  const endMin   = (eh ?? 0) * 60 + (em ?? 0)
  const nowMin   = now.getHours() * 60 + now.getMinutes()
  return nowMin >= startMin && nowMin < endMin
}

function formatDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const dd       = new Date(d);     dd.setHours(0, 0, 0, 0)

  if (dd.getTime() === today.getTime())    return 'Hoy'
  if (dd.getTime() === tomorrow.getTime()) return 'Mañana'
  return d.toLocaleDateString('es-CU', { weekday: 'long', day: 'numeric', month: 'short' })
}

function useCountdown(targetIso: string | null): string | null {
  const [text, setText] = useState<string | null>(null)
  useEffect(() => {
    if (!targetIso) { setText(null); return }
    const tick = () => {
      const diff = new Date(targetIso).getTime() - Date.now()
      if (diff <= 0) { setText(null); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      setText(h > 0 ? `en ${h}h ${m}min` : `en ${m} min`)
    }
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [targetIso])
  return text
}

export function BusinessHero({ name, description, nextWindow }: Props) {
  const openNow   = isOpenNow(nextWindow)
  const closeAt   = openNow && nextWindow
    ? `${nextWindow.date}T${nextWindow.endTime}:00`
    : null
  const opensAt   = !openNow && nextWindow
    ? `${nextWindow.date}T${nextWindow.startTime}:00`
    : null
  const countdownClose = useCountdown(closeAt)
  const countdownOpen  = useCountdown(opensAt)

  return (
    <section className="relative overflow-hidden border-b" style={{ borderColor: 'var(--glass-border)' }}>
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-16 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #14B8A6, transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }}
      />

      <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        {/* Status badge */}
        <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium glass">
          <span
            className={`relative flex h-2 w-2 ${openNow ? '' : 'opacity-70'}`}
          >
            <span
              className={`absolute inset-0 rounded-full ${openNow ? 'animate-ping bg-emerald-500' : 'bg-slate-400'}`}
            />
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${openNow ? 'bg-emerald-500' : 'bg-slate-400'}`}
            />
          </span>
          <span style={{ color: 'var(--text)' }}>
            {openNow
              ? <>Abierto ahora {countdownClose && <span style={{ color: 'var(--muted)' }}>· cierra {countdownClose}</span>}</>
              : nextWindow
                ? <>Cerrado <span style={{ color: 'var(--muted)' }}>· abre {formatDate(nextWindow.date)} {nextWindow.startTime}</span></>
                : <>Sin ventanas próximas</>
            }
          </span>
        </div>

        {/* Business name */}
        <h1
          className="mb-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          style={{ color: 'var(--text)' }}
        >
          {name}
        </h1>

        {/* Description */}
        {description && (
          <p className="mb-6 max-w-2xl text-base sm:text-lg" style={{ color: 'var(--muted)' }}>
            {description}
          </p>
        )}

        {/* Next pickup card */}
        {nextWindow && (
          <div
            className="inline-flex flex-col gap-1 rounded-2xl glass px-5 py-3 text-sm"
            style={{ border: '1px solid var(--glass-border)' }}
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              {openNow ? 'Ventana en curso' : 'Próxima recogida'}
            </span>
            <span className="text-base font-bold" style={{ color: 'var(--text)' }}>
              {formatDate(nextWindow.date)} · {nextWindow.startTime}–{nextWindow.endTime}
            </span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {nextWindow.spotsLeft > 0
                ? `${nextWindow.spotsLeft} cupos disponibles`
                : 'Ventana llena — probá la siguiente'}
              {countdownOpen && <> · {countdownOpen}</>}
            </span>
          </div>
        )}
      </div>
    </section>
  )
}
