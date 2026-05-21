'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'

interface Props {
  onSubmit: (name: string, phone: string) => Promise<void>
  loading:  boolean
  error?:   string | null
}

/** Formatea el input del usuario a E.164 cubano: +537XXXXXXXX */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('53') && digits.length === 10) return `+${digits}`
  if (digits.length === 8) return `+537${digits}`  // número local cubano
  if (digits.startsWith('0') && digits.length === 9) return `+53${digits.slice(1)}`
  return raw.startsWith('+') ? raw : `+${digits}`
}

export function CheckoutForm({ onSubmit, loading, error }: Props) {
  const [name,  setName]  = useState('')
  // Default +53 — todos los números son cubanos por ahora
  const [local, setLocal] = useState('')  // solo los dígitos locales (sin +53)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fullPhone = local ? formatPhone(local) : ''
    void onSubmit(name.trim(), fullPhone)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="checkout-name">
          Tu nombre <span className="normal-case font-normal opacity-60">(opcional)</span>
        </Label>
        <Input
          id="checkout-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: María García"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="checkout-phone">
          Tu número de Telegram <span className="text-[var(--error)]">*</span>
        </Label>
        {/* Prefix cubano fijo */}
        <div className="flex items-center gap-2 rounded-lg border px-3 py-2"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <span className="text-lg leading-none select-none">🇨🇺</span>
          <span className="text-sm font-mono shrink-0" style={{ color: 'var(--muted)' }}>+53</span>
          <input
            id="checkout-phone"
            type="tel"
            inputMode="numeric"
            required
            value={local}
            onChange={(e) => setLocal(e.target.value.replace(/\D/g, '').slice(0, 8))}
            placeholder="58901234"
            maxLength={8}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--text)' }}
          />
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Recibirás un código de verificación por Telegram
        </p>
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
        type="submit"
        disabled={loading || local.trim().length < 7}
        className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90"
      >
        {loading ? 'Enviando código…' : 'Recibir código por Telegram'}
      </Button>
    </form>
  )
}
