'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await forgotPassword(email)
    setSent(true)
    setLoading(false)
  }

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
              <Logo size="md" variant="page" className="h-8 w-auto" />
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-8">
          {!sent ? (
            <>
              <h1 className="mb-1 text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                Recuperar contraseña
              </h1>
              <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
                Ingresá tu email y si existe una cuenta, te enviaremos un link para restablecer tu contraseña.
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

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-1 bg-gradient-teal-violet shadow-glow hover:opacity-90"
                >
                  {loading ? 'Enviando…' : 'Enviar link →'}
                </Button>

                <Link
                  href="/login"
                  className="text-center text-sm"
                  style={{ color: 'var(--muted)' }}
                >
                  ← Volver al login
                </Link>
              </form>
            </>
          ) : (
            <>
              <h1 className="mb-2 text-xl font-bold" style={{ color: 'var(--text)', fontFamily: 'Inter, sans-serif' }}>
                Revisá tu email
              </h1>
              <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
                Si existe una cuenta con ese email, te enviamos un link para restablecer tu contraseña. El link expira en 60 minutos.
              </p>
              <Link href="/login">
                <Button className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90">
                  ← Volver al login
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
