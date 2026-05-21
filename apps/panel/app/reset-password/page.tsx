'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { resetPassword } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'

function ResetPasswordForm() {
  const params  = useSearchParams()
  const router  = useRouter()
  const token   = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [done,     setDone]     = useState(false)

  if (!token) {
    return (
      <>
        <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--text)' }}>Link inválido</h1>
        <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
          Este link de reset no es válido. Solicitá uno nuevo.
        </p>
        <Link href="/forgot-password">
          <Button className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90">
            Solicitar nuevo link
          </Button>
        </Link>
      </>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 10) {
      setError('La contraseña debe tener al menos 10 caracteres')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'reset_failed'
      setError(
        msg === 'token_invalid_or_expired'
          ? 'El link expiró o ya fue usado. Solicitá uno nuevo.'
          : 'Error al restablecer la contraseña. Intentá de nuevo.',
      )
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <>
        <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--text)' }}>
          ¡Contraseña actualizada!
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Tu contraseña fue restablecida. Redirigiendo al login…
        </p>
      </>
    )
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
        Nueva contraseña
      </h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
        Mínimo 10 caracteres.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Nueva contraseña</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={10}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirmar contraseña</Label>
          <Input
            id="confirm"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••••"
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
          {loading ? 'Guardando…' : 'Cambiar contraseña →'}
        </Button>

        <Link href="/login" className="text-center text-sm" style={{ color: 'var(--muted)' }}>
          ← Volver al login
        </Link>
      </form>
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="fixed inset-0 flex items-center justify-center px-4">
      <div
        className="pointer-events-none absolute top-1/4 left-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }}
      />
      <div
        className="pointer-events-none absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full opacity-20 blur-3xl animate-float"
        style={{ background: 'radial-gradient(circle, #A855F7, transparent)', animationDelay: '3s' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <div className="animate-float">
            <div className="flex items-center justify-center rounded-2xl bg-slate-950/60 px-4 py-3 shadow-glow">
              <Logo size="md" variant="sidebar" className="h-8 w-auto" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-8">
          <Suspense fallback={<p style={{ color: 'var(--muted)' }}>Cargando…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
