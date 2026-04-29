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
      <p className="text-sm text-gray-600">
        Ingresá el código de 6 dígitos enviado a <strong>{phone}</strong>
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
            className="h-12 w-10 rounded-xl border border-gray-300 text-center text-lg font-bold outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        ))}
      </div>

      {error != null && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || otp.length < 6}
        className="w-full rounded-xl bg-teal-700 py-3 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? 'Verificando…' : 'Verificar código'}
      </button>

      <button
        type="button"
        onClick={() => void onResend()}
        className="text-center text-sm text-teal-700 underline"
      >
        Reenviar código
      </button>
    </form>
  )
}
