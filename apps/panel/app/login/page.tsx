'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginOwner } from '../../lib/api'
import { Logo } from '../../components/logo'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { token } = await loginOwner(email, password)
      sessionStorage.setItem('panel_token', token)
      router.push('/orders')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo centered */}
        <div className="flex justify-center mb-8">
          <Logo size="md" variant="page" />
        </div>

        <div className="rounded-2xl border p-8" style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}>
          <h1 className="mb-1 text-xl font-bold font-display" style={{ color: 'var(--text)' }}>
            Acceso al panel
          </h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
            Ingresá con tu cuenta de negocio
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-1 transition-colors"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                placeholder="owner@negocio.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-1 transition-colors"
                style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
                placeholder="••••••••"
              />
            </div>

            {error != null && (
              <p className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: 'rgba(255,61,85,0.1)', color: 'var(--error)', border: '1px solid rgba(255,61,85,0.2)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50 mt-1"
              style={{ backgroundColor: 'var(--primary)', color: '#07080A' }}
            >
              {loading ? 'Ingresando…' : 'Ingresar →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
