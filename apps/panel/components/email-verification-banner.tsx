'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { getMe, sendVerificationEmail, isAuthenticatedClient } from '../lib/api'

const HIDE_ON = ['/login', '/forgot-password', '/reset-password', '/verify-email']

export function EmailVerificationBanner() {
  const pathname = usePathname()
  const [show, setShow]       = useState(false)
  const [email, setEmail]     = useState<string>('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!isAuthenticatedClient()) return
    if (HIDE_ON.some((p) => pathname?.startsWith(p))) return

    void getMe('')
      .then((u) => {
        if (!u.emailVerifiedAt) {
          setEmail(u.email)
          setShow(true)
        } else {
          setShow(false)
        }
      })
      .catch(() => { /* noop */ })
  }, [pathname])

  if (!show) return null

  async function handleResend() {
    setSending(true)
    try {
      const res = await sendVerificationEmail()
      if (res.alreadyVerified) {
        toast.success('Tu email ya está verificado — refrescá la página')
        setShow(false)
      } else {
        toast.success('Email enviado — revisá tu casilla')
      }
    } catch {
      toast.error('No se pudo enviar el email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="sticky top-0 z-30 flex items-center justify-center gap-3 px-4 py-2 text-sm bg-amber-50 border-b border-amber-500/30 text-amber-600"
    >
      <span>⚠️ Tu email <strong>{email}</strong> está sin verificar.</span>
      <button
        type="button"
        onClick={() => void handleResend()}
        disabled={sending}
        className="underline underline-offset-2 font-medium hover:opacity-80 disabled:opacity-50"
      >
        {sending ? 'Enviando…' : 'Reenviar email'}
      </button>
    </div>
  )
}
