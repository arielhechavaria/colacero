'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TelegramLoginButton, type TelegramUser } from '../../../components/telegram-login-button'
import { PickupWindowSelector }                   from '../../../components/pickup-window-selector'
import { useCartContext }                          from '../../../context/cart-context'
import {
  telegramWidgetAuth,
  getPickupWindows,
  checkout,
  isAuthenticatedClient,
  type PickupWindow,
} from '../../../lib/client-api'

type Step = 'auth' | 'window'

const TG_BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ?? 'ColaCeroBot'

export default function CheckoutPage() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()
  const { items, total, clear } = useCartContext()

  const [step, setStep]                     = useState<Step>('auth')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)
  const [name, setName]                     = useState('')
  const [authed, setAuthed]                 = useState<boolean>(false)
  const [windows, setWindows]               = useState<PickupWindow[]>([])
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null)
  const [reservationIds, setReservationIds] = useState<string[]>([])
  const [notes, setNotes]                   = useState('')

  // Leer reservationIds guardados por el drawer
  useEffect(() => {
    const raw = sessionStorage.getItem('colacero_reservation_ids')
    if (raw) {
      setReservationIds(JSON.parse(raw) as string[])
    }
  }, [])

  // Si ya hay sesión (Telegram Mini App auth automático o login previo), saltar auth
  useEffect(() => {
    if (!isAuthenticatedClient()) return
    const savedName = sessionStorage.getItem('colacero_display_name')

    setAuthed(true)
    if (savedName) setName(savedName)

    void (async () => {
      try {
        const ws = await getPickupWindows(slug)
        setWindows(ws)
        setStep('window')
      } catch {
        // Si falla cargar ventanas, dejamos el flujo normal
      }
    })()
  }, [slug])

  // Redirigir si el carrito está vacío
  useEffect(() => {
    if (items.length === 0) {
      router.replace(`/${slug}`)
    }
  }, [items.length, router, slug])

  // ── Auth vía Telegram Login Widget ────────────────────────────────────────

  async function handleWidgetAuth(user: TelegramUser) {
    setLoading(true)
    setError(null)
    try {
      const result = await telegramWidgetAuth(user)
      setAuthed(true)
      if (result.customer.displayName) {
        sessionStorage.setItem('colacero_display_name', result.customer.displayName)
        setName(result.customer.displayName)
      }

      const ws = await getPickupWindows(slug)
      setWindows(ws)
      setStep('window')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'auth_expired') {
        setError('La autorización expiró. Tocá el botón de Telegram de nuevo.')
      } else if (msg === 'invalid_hash') {
        setError('No pudimos verificar tu identidad. Probá de nuevo.')
      } else {
        setError('Error al autenticar con Telegram. Probá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Confirmar pedido ──────────────────────────────────────────────────────

  async function handleConfirm() {
    if (!selectedWindow || !authed) return
    setLoading(true)
    setError(null)
    try {
      const result = await checkout({
        pickupWindowId: selectedWindow,
        reservationIds,
        ...(name        ? { customerName: name }   : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      })

      clear()
      sessionStorage.removeItem('colacero_reservation_ids')

      router.push(`/${slug}/confirmation/${result.orderId}`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      if (msg === 'window_full') {
        setError('Esa ventana ya no tiene lugares. Elegí otra.')
      } else if (msg === 'reservation_expired') {
        setError('Tu reserva expiró. Volvé al catálogo y agregá los productos de nuevo.')
      } else {
        setError('No pudimos confirmar tu pedido. Intentá de nuevo.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const stepLabels: Record<Step, string> = {
    auth:   '1. Identificate',
    window: '2. Fecha de recogida',
  }

  const STEPS: Step[] = ['auth', 'window']
  const stepIdx = STEPS.indexOf(step)

  return (
    <main className="min-h-screen">
      <header
        className="sticky top-0 z-10 glass px-4 py-3"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="px-2">
            ←
          </Button>
          <div className="flex-1">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Confirmar pedido
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {stepLabels[step]}
            </p>
          </div>
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className="h-1.5 w-4 rounded-full transition-all"
                style={{
                  background: i <= stepIdx
                    ? 'linear-gradient(135deg, #6366F1, #8B5CF6)'
                    : 'var(--border)',
                }}
              />
            ))}
          </div>
        </div>
      </header>

      <div
        className="mx-auto max-w-lg px-4 py-4 flex flex-col gap-4"
        style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        {/* Resumen del carrito */}
        <div className="glass rounded-2xl p-4">
          <h2
            className="mb-2 text-xs font-semibold uppercase tracking-wide"
            style={{ color: 'var(--muted)' }}
          >
            Tu pedido
          </h2>
          <ul className="flex flex-col gap-1.5">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text)' }}>
                  {item.name}
                  <span style={{ color: 'var(--muted)' }}> × {item.quantity}</span>
                </span>
                <span className="font-mono font-semibold text-gradient">
                  ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div
            className="mt-2 border-t pt-2 flex justify-between font-bold"
            style={{ borderColor: 'var(--glass-border)' }}
          >
            <span style={{ color: 'var(--text)' }}>Total</span>
            <span className="font-mono text-gradient">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Step content */}
        <div className="glass rounded-2xl p-5">
          {step === 'auth' && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="flex flex-col items-center gap-2 text-center">
                <span className="text-4xl">✈️</span>
                <p className="font-semibold text-base" style={{ color: 'var(--text)' }}>
                  Iniciá sesión con Telegram
                </p>
                <p className="text-sm max-w-xs" style={{ color: 'var(--muted)' }}>
                  Es 1 tap. Sin código, sin teléfono. No compartimos tus datos con nadie.
                </p>
              </div>

              <TelegramLoginButton
                botUsername={TG_BOT_USERNAME}
                onAuth={handleWidgetAuth}
              />

              {loading && (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Autenticando…
                </p>
              )}

              {error && (
                <p
                  className="rounded-lg px-3 py-2 text-sm text-center"
                  style={{ backgroundColor: 'rgba(255,61,85,0.1)', color: 'var(--error)' }}
                >
                  {error}
                </p>
              )}
            </div>
          )}

          {step === 'window' && (
            <PickupWindowSelector
              windows={windows}
              selected={selectedWindow}
              onSelect={setSelectedWindow}
              onConfirm={handleConfirm}
              loading={loading}
              error={error}
              notes={notes}
              onNotesChange={setNotes}
              businessSlug={slug}
            />
          )}
        </div>
      </div>
    </main>
  )
}
