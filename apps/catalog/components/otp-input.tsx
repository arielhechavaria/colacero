'use client'

import { useState, useRef } from 'react'

interface Props {
  phone:    string
  onSubmit: (otp: string) => Promise<void>
  onResend: () => Promise<void>
  loading:  boolean
  error?:   string | null
}

export function OtpInput({ phone, onSubmit, onResend, loading, error }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value
    setDigits(next)
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && digits[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = ['', '', '', '', '', '']
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i] ?? ''
    setDigits(next)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const otp = digits.join('')
    if (otp.length === 6) void onSubmit(otp)
  }

  const otp = digits.join('')

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: 'var(--muted)' }}>
        Ingresá el código de 6 dígitos enviado a{' '}
        <strong style={{ color: 'var(--text)' }}>{phone}</strong>
      </p>

      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className="h-12 w-10 rounded-xl border text-center text-lg font-bold outline-none transition-colors"
            style={{
              fontFamily:      'var(--font-mono)',
              backgroundColor: 'var(--surface)',
              borderColor:     d ? 'var(--primary)' : 'var(--border)',
              color:           'var(--text)',
            }}
          />
        ))}
      </div>

      {error != null && (
        <p
          className="rounded-xl px-3 py-2 text-sm text-center"
          style={{ backgroundColor: 'rgba(255,61,85,0.1)', color: 'var(--error)' }}
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || otp.length < 6}
        className="w-full rounded-xl py-3 text-sm font-semibold disabled:opacity-50"
        style={{ backgroundColor: 'var(--primary)', color: 'var(--sidebar)' }}
      >
        {loading ? 'Verificando…' : 'Verificar código'}
      </button>

      <button
        type="button"
        onClick={() => void onResend()}
        className="text-center text-sm underline"
        style={{ color: 'var(--primary)' }}
      >
        Reenviar código
      </button>
    </form>
  )
}
