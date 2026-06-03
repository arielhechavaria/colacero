'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { verifyEmail } from '../../lib/api'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'

type Status = 'verifying' | 'success' | 'error'

function VerifyEmailContent() {
  const params = useSearchParams()
  const token  = params.get('token') ?? ''

  const [status, setStatus] = useState<Status>('verifying')
  const [email,  setEmail]  = useState<string | null>(null)
  const [error,  setError]  = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setError('Link inválido — falta el token.')
      return
    }

    void verifyEmail(token)
      .then((res) => {
        setEmail(res.email)
        setStatus('success')
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'verify_email_failed'
        setError(
          msg === 'token_invalid_or_expired'
            ? 'El link expiró o ya fue usado. Pedí uno nuevo desde tu panel.'
            : 'No se pudo verificar el email. Intentá de nuevo.',
        )
        setStatus('error')
      })
  }, [token])

  if (status === 'verifying') {
    return (
      <>
        <h1 className="mb-2 text-xl font-bold text-slate-900">Verificando…</h1>
        <p className="text-sm text-slate-500">Confirmando tu email.</p>
      </>
    )
  }

  if (status === 'success') {
    return (
      <>
        <h1 className="mb-2 text-xl font-bold text-slate-900">
          ✓ Email verificado
        </h1>
        <p className="mb-6 text-sm text-slate-500">
          {email ? <><strong>{email}</strong> quedó confirmado.</> : 'Tu email quedó confirmado.'}
        </p>
        <Link href="/orders">
          <Button className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90">
            Ir al panel →
          </Button>
        </Link>
      </>
    )
  }

  return (
    <>
      <h1 className="mb-2 text-xl font-bold text-slate-900">
        Link inválido
      </h1>
      <p className="mb-6 text-sm text-slate-500">{error}</p>
      <Link href="/orders">
        <Button className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90">
          Volver al panel
        </Button>
      </Link>
    </>
  )
}

export default function VerifyEmailPage() {
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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
          <Suspense fallback={<p className="text-slate-500">Cargando…</p>}>
            <VerifyEmailContent />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
