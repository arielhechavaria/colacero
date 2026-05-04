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
  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formatted = formatPhone(phone)
    void onSubmit(name.trim(), formatted)
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
        <Input
          id="checkout-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej: 58901234"
          required
        />
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
        disabled={loading || phone.trim() === ''}
        className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90"
      >
        {loading ? 'Enviando código…' : 'Recibir código por Telegram'}
      </Button>
    </form>
  )
}
