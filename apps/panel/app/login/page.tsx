'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginOwner } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'

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
    <div className="fixed inset-0 flex items-center justify-center px-4">
      {/* Background orbs */}
      <div
        className="pointer-events-none absolute top-1/4 left-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }}
      />
      <div
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'radial-gradient(circle, #A855F7, transparent)', animationDelay: '3s' }}
      />

      <div className="relative w-full max-w-sm">
        {/* Logo mark */}
        <div className="flex justify-center mb-8">
          <div className="animate-float">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-teal-violet text-white text-2xl font-black shadow-glow animate-glow">
              C
            </div>
          </div>
        </div>

        {/* Glass card */}
        <div className="glass rounded-2xl p-8">
          <h1 className="mb-1 text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
            Acceso al panel
          </h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
            Ingresá con tu cuenta de negocio
          </p>

          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@negocio.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error != null && (
              <p className="rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: 'var(--error)', border: '1px solid rgba(220,38,38,0.2)' }}>
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-1 bg-gradient-teal-violet shadow-glow hover:opacity-90"
            >
              {loading ? 'Ingresando…' : 'Ingresar →'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
