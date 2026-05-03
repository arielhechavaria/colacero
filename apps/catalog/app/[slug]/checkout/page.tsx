'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { CheckoutForm }           from '../../../components/checkout-form'
import { OtpInput }               from '../../../components/otp-input'
import { PickupWindowSelector }   from '../../../components/pickup-window-selector'
import { useCartContext }          from '../../../context/cart-context'
import {
  requestOtp,
  verifyOtp,
  getPickupWindows,
  checkout,
  type PickupWindow,
} from '../../../lib/client-api'

type Step = 'form' | 'otp' | 'window'

export default function CheckoutPage() {
  const router = useRouter()
  const { slug } = useParams<{ slug: string }>()
  const { items, total, clear } = useCartContext()

  const [step, setStep]                   = useState<Step>('form')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [phone, setPhone]                 = useState('')
  const [name, setName]                   = useState('')
  const [token, setToken]                 = useState<string | null>(null)
  const [windows, setWindows]             = useState<PickupWindow[]>([])
  const [selectedWindow, setSelectedWindow] = useState<string | null>(null)
  const [reservationIds, setReservationIds] = useState<string[]>([])
  const [notes, setNotes]                 = useState('')
  const [devCode, setDevCode]             = useState<string | null>(null)

  // Leer reservationIds guardados por el drawer
  useEffect(() => {
    const raw = sessionStorage.getItem('colacero_reservation_ids')
    if (raw) {
      setReservationIds(JSON.parse(raw) as string[])
    }
  }, [])

  // Si ya hay token (Telegram Mini App auth automático), saltar form + OTP
  useEffect(() => {
    const savedToken = sessionStorage.getItem('colacero_token')
    const savedName  = sessionStorage.getItem('colacero_display_name')
    if (!savedToken) return

    setToken(savedToken)
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

  // Redirigir si el carrito está vacío (sin reservas)
  useEffect(() => {
    if (items.length === 0) {
      router.replace(`/${slug}`)
    }
  }, [items.length, router, slug])

  // ── Paso 1: solicitar OTP ──────────────────────────────────────────────────

  async function handleFormSubmit(customerName: string, customerPhone: string) {
    setLoading(true)
    setError(null)
    try {
      const otpResult = await requestOtp(customerPhone)
      if (otpResult._devCode) setDevCode(otpResult._devCode)
      setPhone(customerPhone)
      setName(customerName)
      setStep('otp')
    } catch {
      setError('No pudimos enviar el código. Verificá el número e intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Paso 2: verificar OTP ─────────────────────────────────────────────────

  async function handleOtpSubmit(otp: string) {
    setLoading(true)
    setError(null)
    try {
      const result = await verifyOtp(phone, otp)
      sessionStorage.setItem('colacero_token', result.token)
      setToken(result.token)

      // Cargar ventanas de recogida
      const ws = await getPickupWindows(slug)
      setWindows(ws)
      setStep('window')
    } catch (err) {
      const msg = err instanceof Error ? err.message : ''
      setError(
        msg === 'invalid_otp'
          ? 'Código incorrecto. Revisá el mensaje de WhatsApp.'
          : 'Error al verificar el código. Intentá de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOtp() {
    setError(null)
    try {
      const otpResult = await requestOtp(phone)
      if (otpResult._devCode) setDevCode(otpResult._devCode)
    } catch {
      setError('No pudimos reenviar el código.')
    }
  }

  // ── Paso 3: confirmar pedido ──────────────────────────────────────────────

  async function handleConfirm() {
    if (!selectedWindow || !token) return
    setLoading(true)
    setError(null)
    try {
      const result = await checkout(
        {
          pickupWindowId: selectedWindow,
          reservationIds,
          ...(name        ? { customerName: name }        : {}),
          ...(notes.trim() ? { notes: notes.trim() }      : {}),
        },
        token,
      )

      // Limpiar estado
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
    form:   '1. Tu contacto',
    otp:    '2. Verificación',
    window: '3. Fecha de recogida',
  }

  const STEPS: Step[] = ['form', 'otp', 'window']
  const stepIdx = STEPS.indexOf(step)

  return (
    <main className="min-h-screen">
      {/* Header glass */}
      <header
        className="sticky top-0 z-10 glass px-4 py-3"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-sm font-medium"
            style={{ color: 'var(--primary)' }}
          >
            ←
          </button>
          <div className="flex-1">
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Confirmar pedido
            </p>
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              {stepLabels[step]}
            </p>
          </div>
          {/* Step dots */}
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
        {/* Resumen del carrito — glass */}
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

        {/* Step content — glass */}
        <div className="glass rounded-2xl p-5">
          {step === 'form' && (
            <CheckoutForm
              onSubmit={handleFormSubmit}
              loading={loading}
              error={error}
            />
          )}
          {step === 'otp' && (
            <>
              {devCode && (
                <div
                  className="mb-4 rounded-xl px-4 py-3 text-sm flex items-center gap-3"
                  style={{
                    background: 'rgba(251,191,36,0.1)',
                    border:     '1px solid rgba(251,191,36,0.3)',
                    color:      '#FCD34D',
                  }}
                >
                  <span className="text-lg">🔧</span>
                  <span>
                    Modo demo — tu código es{' '}
                    <strong className="font-mono tracking-widest">{devCode}</strong>
                  </span>
                </div>
              )}
              <OtpInput
                phone={phone}
                onSubmit={handleOtpSubmit}
                onResend={handleResendOtp}
                loading={loading}
                error={error}
              />
            </>
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
            />
          )}
        </div>
      </div>
    </main>
  )
}
