'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { publishAnnouncement, getProducts, type Product } from '../../lib/api'

interface SentAnnouncement {
  text:   string
  sentAt: Date
  jobId:  string
}

const CATALOG_URL = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3001/el-fogon`
  : ''

const MAX_CHARS = 4096

// ── Plantillas ────────────────────────────────────────────────────────────────

function buildDailyTemplate(products: Product[]): string {
  const lines = products
    .filter(p => p.isActive)
    .map(p => `  • ${p.name} — $${p.unitPrice}/${p.unitLabel}`)
    .join('\n')
  return `🛒 ¡Disponible hoy!\n\n${lines}\n\n⏰ Reservá antes de las 20:00 hs\n👉 ${CATALOG_URL}`
}

function buildOfferTemplate(products: Product[]): string {
  const first = products.find(p => p.isActive)
  const name  = first ? first.name : 'producto'
  return `🔥 ¡Oferta especial!\n\n${name} a precio rebajado por tiempo limitado.\n\n👉 Mirá todo en: ${CATALOG_URL}`
}

function buildReminderTemplate(): string {
  return `⏰ Recordatorio: el plazo para reservar cierra hoy a las 20:00 hs.\n\nSi todavía no hiciste tu pedido, entrá ahora:\n👉 ${CATALOG_URL}`
}

// ── Componente ────────────────────────────────────────────────────────────────

export default function AnnouncementsPage() {
  const router   = useRouter()
  const tokenRef = useRef<string | null>(null)

  const [text,       setText]       = useState('')
  const [sending,    setSending]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [history,    setHistory]    = useState<SentAnnouncement[]>([])
  const [products,   setProducts]   = useState<Product[]>([])
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [loadingP,   setLoadingP]   = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
    getProducts(token)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoadingP(false))
  }, [router])

  // Insertar producto seleccionado en el mensaje
  function toggleProduct(p: Product) {
    const line = `• ${p.name} — $${p.unitPrice}/${p.unitLabel}`
    if (selected.has(p.id)) {
      setSelected(prev => { const s = new Set(prev); s.delete(p.id); return s })
      setText(prev => prev.replace('\n' + line, '').replace(line + '\n', '').replace(line, '').trimEnd())
    } else {
      setSelected(prev => new Set(prev).add(p.id))
      setText(prev => (prev ? prev + '\n' + line : line))
    }
  }

  function applyTemplate(tpl: string) {
    setText(tpl)
    setSelected(new Set())
  }

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault()
    const token = tokenRef.current
    if (!token || !text.trim()) return
    setSending(true)
    setError(null)
    try {
      const result = await publishAnnouncement(token, text.trim())
      setHistory(prev => [{ text: text.trim(), sentAt: new Date(), jobId: result.jobId ?? '' }, ...prev])
      setText('')
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al publicar')
    } finally {
      setSending(false)
    }
  }

  const charsLeft     = MAX_CHARS - text.length
  const activeProducts = products.filter(p => p.isActive)

  return (
    <main className="min-h-screen bg-gray-50">

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

        {/* 1 — Plantillas */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">⚡ Plantillas rápidas</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyTemplate(buildDailyTemplate(products))}
              className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
            >
              📅 Anuncio diario
            </button>
            <button
              onClick={() => applyTemplate(buildOfferTemplate(products))}
              className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100"
            >
              🔥 Oferta especial
            </button>
            <button
              onClick={() => applyTemplate(buildReminderTemplate())}
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
            >
              ⏰ Recordatorio
            </button>
            <button
              disabled
              title="Próximamente"
              className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-400 cursor-not-allowed"
            >
              ✨ Generar con IA
              <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-500">
                Próx.
              </span>
            </button>
          </div>
        </section>

        {/* 2 — Selector de productos */}
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">🛒 Agregar productos al mensaje</p>
          {loadingP ? (
            <p className="text-xs text-gray-400">Cargando productos…</p>
          ) : activeProducts.length === 0 ? (
            <p className="text-xs text-gray-400">No hay productos activos.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {activeProducts.map(p => {
                const on = selected.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p)}
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                      on
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <span className={`text-xs font-semibold ${on ? 'text-blue-700' : 'text-gray-700'}`}>
                      {on ? '✓ ' : ''}{p.name}
                    </span>
                    <span className="mt-0.5 text-xs text-gray-400">
                      ${p.unitPrice}/{p.unitLabel}
                    </span>
                    {p.inventory && (
                      <span className="mt-1 text-[10px] text-gray-400">
                        Stock: {p.inventory.quantityAvailable}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {/* 3 — Editor + publicar */}
        <form
          onSubmit={(e) => void handlePublish(e)}
          className="rounded-2xl bg-white p-5 shadow-sm flex flex-col gap-3"
        >
          <p className="text-sm font-semibold text-gray-700">✏️ Mensaje</p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Escribí tu anuncio o usá una plantilla ↑\n\nEl link al catálogo se puede agregar con las plantillas.'}
            rows={7}
            maxLength={MAX_CHARS}
            className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none font-mono"
          />

          <div className="flex items-center justify-between">
            <span className={`text-xs ${charsLeft < 200 ? 'text-amber-500' : 'text-gray-400'}`}>
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

        {/* 4 — Historial */}
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

      </div>
    </main>
  )
}
