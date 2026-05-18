'use client'

import { useState } from 'react'

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'https://api.colacero.com'

export function LeadForm({ source = 'landing' }: { source?: string }) {
  const [email,        setEmail]        = useState('')
  const [telegram,     setTelegram]     = useState('')
  const [businessKind, setBusinessKind] = useState('')
  const [message,      setMessage]      = useState('')
  const [loading,      setLoading]      = useState(false)
  const [done,         setDone]         = useState(false)
  const [error,        setError]        = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, telegram, businessKind, message, source }),
      })
      if (!res.ok) throw new Error('lead_failed')
      setDone(true)
    } catch {
      setError('No se pudo enviar. Probá de nuevo o escribinos por Telegram.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div
        className="glass rounded-2xl p-6 text-center"
        style={{ border: '1px solid var(--glass-border)' }}
      >
        <div className="mb-3 text-4xl">✅</div>
        <h3 className="mb-2 text-lg font-bold" style={{ color: 'var(--text)' }}>
          ¡Gracias!
        </h3>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Recibimos tus datos. Te escribimos en las próximas 24 horas.
        </p>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="glass rounded-2xl p-6 space-y-4"
      style={{ border: '1px solid var(--glass-border)' }}
    >
      <div>
        <label htmlFor="email" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--text)' }}>
          Email *
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vos@email.com"
          className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
          style={{ borderColor: 'var(--glass-border)', color: 'var(--text)' }}
        />
      </div>

      <div>
        <label htmlFor="telegram" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--text)' }}>
          Telegram (opcional)
        </label>
        <input
          id="telegram"
          type="text"
          value={telegram}
          onChange={(e) => setTelegram(e.target.value)}
          placeholder="@tuusuario"
          className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
          style={{ borderColor: 'var(--glass-border)', color: 'var(--text)' }}
        />
      </div>

      <div>
        <label htmlFor="kind" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--text)' }}>
          ¿Qué negocio tenés?
        </label>
        <input
          id="kind"
          type="text"
          value={businessKind}
          onChange={(e) => setBusinessKind(e.target.value)}
          placeholder="Carnicería, panadería, viandas…"
          className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
          style={{ borderColor: 'var(--glass-border)', color: 'var(--text)' }}
        />
      </div>

      <div>
        <label htmlFor="msg" className="mb-1 block text-xs font-semibold" style={{ color: 'var(--text)' }}>
          ¿Algo que querés contarnos? (opcional)
        </label>
        <textarea
          id="msg"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hace cuánto vendés, qué te frustra del flow actual, etc."
          className="w-full rounded-xl border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
          style={{ borderColor: 'var(--glass-border)', color: 'var(--text)' }}
        />
      </div>

      {error && (
        <p className="text-xs" style={{ color: '#dc2626' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-gradient-teal-violet shadow-glow block w-full rounded-xl py-3 text-base font-semibold text-white hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Enviando…' : 'Enviar →'}
      </button>

      <p className="text-center text-[11px]" style={{ color: 'var(--muted)' }}>
        Te respondemos en menos de 24h. No spam, ni tarjeta, ni contrato.
      </p>
    </form>
  )
}
