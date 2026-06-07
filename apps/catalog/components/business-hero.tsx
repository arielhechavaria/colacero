'use client'

import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import type { NextPickupWindow } from '../lib/api'

interface Props {
  name:        string
  description: string | null | undefined
  nextWindow:  NextPickupWindow | null
  address:     string | null | undefined
  latitude:    number | null | undefined
  longitude:   number | null | undefined
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

export function BusinessHero({ name, description, nextWindow, address, latitude, longitude }: Props) {
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

        {/* Pickup + Location — fila horizontal en desktop */}
        <div className="flex flex-wrap items-start gap-3">
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

          {/* Location button */}
          {(address ?? (latitude != null && longitude != null)) && (() => {
            const hasCoords = latitude != null && longitude != null
            const geoHref   = hasCoords
              ? `geo:${latitude},${longitude}?q=${latitude},${longitude}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address ?? '')}`
            const mapsHref  = hasCoords
              ? `https://www.google.com/maps?q=${latitude},${longitude}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address ?? '')}`

            return (
              <div
                className="inline-flex flex-col gap-1 rounded-2xl glass px-5 py-3 text-sm"
                style={{ border: '1px solid var(--glass-border)' }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Dónde recoger
                </span>
                {address && (
                  <span className="text-sm" style={{ color: 'var(--text)' }}>{address}</span>
                )}
                <a
                  href={geoHref}
                  onClick={(e) => {
                    // Si el navegador no soporta geo:, fallback a Google Maps
                    e.preventDefault()
                    window.open(mapsHref, '_blank', 'noopener,noreferrer')
                  }}
                  className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold w-fit rounded-lg px-3 py-1.5 transition-opacity active:opacity-70"
                  style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.2)' }}
                >
                  <MapPin className="h-3.5 w-3.5" strokeWidth={2} /> Cómo llegar
                </a>
              </div>
            )
          })()}
        </div>
      </div>
    </section>
  )
}
