'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { publishAnnouncement } from '../../lib/api'

interface SentAnnouncement {
  text:      string
  sentAt:    Date
  jobId:     string
}

const MAX_CHARS = 4096

export default function AnnouncementsPage() {
  const router   = useRouter()
  const tokenRef = useRef<string | null>(null)

  const [text,      setText]      = useState('')
  const [sending,   setSending]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [history,   setHistory]   = useState<SentAnnouncement[]>([])

  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
  }, [router])

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    const token = tokenRef.current
    if (!token || !text.trim()) return

    setSending(true)
    setError(null)
    try {
      const result = await publishAnnouncement(token, text.trim())
      setHistory((prev) => [
        { text: text.trim(), sentAt: new Date(), jobId: result.jobId ?? '' },
        ...prev,
      ])
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al publicar')
    } finally {
      setSending(false)
    }
  }

  const charsLeft = MAX_CHARS - text.length

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-blue-600 px-4 py-4 text-white shadow-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">📣 Canal de anuncios</h1>
            <p className="text-sm text-blue-200">Publicá en tu canal de Telegram</p>
          </div>
          <button
            onClick={() => router.push('/orders')}
            className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold hover:bg-blue-400"
          >
            ← Pedidos
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-6 flex flex-col gap-4">

        {/* Compose */}
        <form
          onSubmit={(e) => void handlePublish(e)}
          className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-3"
        >
          <p className="text-sm font-semibold text-gray-700">Nuevo anuncio</p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ej: 🐔 Mañana martes — Pollo $350/lb · Cerdo $280/lb · Arroz $45/libra&#10;Reservá antes de las 20:00 hs"
            rows={5}
            maxLength={MAX_CHARS}
            className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <span className={`text-xs ${charsLeft < 100 ? 'text-amber-500' : 'text-gray-400'}`}>
              {charsLeft} caracteres restantes
            </span>
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Publicando…' : '📤 Publicar en canal'}
            </button>
          </div>

          {error != null && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </form>

        {/* Historial de esta sesión */}
        {history.length > 0 && (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
              Publicados esta sesión
            </p>
            <div className="flex flex-col gap-3">
              {history.map((item, i) => (
                <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{item.text}</p>
                  <p className="mt-1.5 text-xs text-gray-400">
                    ✅ Enviado a las {item.sentAt.toLocaleTimeString('es-CU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tip */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-700 mb-1">💡 Tips para anuncios efectivos</p>
          <ul className="text-xs text-blue-600 space-y-1">
            <li>• Incluí los productos disponibles con precios y unidades</li>
            <li>• Mencioná el horario límite para reservar</li>
            <li>• Usá emojis para hacer el texto más visual 🥩🍚🛒</li>
            <li>• Publicá la noche anterior para que los clientes puedan planificar</li>
          </ul>
        </div>

      </div>
    </main>
  )
}
