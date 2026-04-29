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

  // Leer reservationIds guardados por el drawer
  useEffect(() => {
    const raw = sessionStorage.getItem('colacero_reservation_ids')
    if (raw) {
      setReservationIds(JSON.parse(raw) as string[])
    }
  }, [])

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
      await requestOtp(customerPhone)
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
      await requestOtp(phone)
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
          ...(name ? { customerName: name } : {}),
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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-teal-700 px-4 pb-6 pt-8 text-white">
        <button
          onClick={() => router.back()}
          className="mb-2 text-sm text-teal-200"
        >
          ← Volver
        </button>
        <h1 className="text-2xl font-bold">Confirmar pedido</h1>
        <p className="mt-1 text-sm text-teal-100">{stepLabels[step]}</p>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Resumen del carrito */}
        <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Tu pedido
          </h2>
          <ul className="flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium text-teal-700">
                  ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t pt-3 flex justify-between font-bold">
            <span>Total</span>
            <span className="text-teal-700">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Steps */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {step === 'form' && (
            <CheckoutForm
              onSubmit={handleFormSubmit}
              loading={loading}
              error={error}
            />
          )}
          {step === 'otp' && (
            <OtpInput
              phone={phone}
              onSubmit={handleOtpSubmit}
              onResend={handleResendOtp}
              loading={loading}
              error={error}
            />
          )}
          {step === 'window' && (
            <PickupWindowSelector
              windows={windows}
              selected={selectedWindow}
              onSelect={setSelectedWindow}
              onConfirm={handleConfirm}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </main>
  )
}
