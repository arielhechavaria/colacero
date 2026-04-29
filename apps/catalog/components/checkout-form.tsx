'use client'

import { useState } from 'react'

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
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Tu nombre <span className="text-gray-400">(opcional)</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: María García"
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Número de WhatsApp <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Ej: 58901234"
          required
          className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
        />
        <p className="mt-1 text-xs text-gray-400">
          Recibirás un código de verificación por WhatsApp
        </p>
      </div>

      {error != null && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || phone.trim() === ''}
        className="w-full rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Enviando código…' : 'Recibir código por WhatsApp'}
      </button>
    </form>
  )
}
