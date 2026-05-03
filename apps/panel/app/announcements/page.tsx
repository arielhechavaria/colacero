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

export default function AnnouncementsPage() {
  const router   = useRouter()
  const tokenRef = useRef<string | null>(null)

  const [text,      setText]      = useState('')
  const [sending,   setSending]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [history,   setHistory]   = useState<SentAnnouncement[]>([])
  const [products,  setProducts]  = useState<Product[]>([])
  const [selected,  setSelected]  = useState<Set<string>>(new Set())
  const [loadingP,  setLoadingP]  = useState(true)

  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
    getProducts(token)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoadingP(false))
  }, [router])

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

  const charsLeft      = MAX_CHARS - text.length
  const activeProducts = products.filter(p => p.isActive)

  return (
    <main className="min-h-screen">
      <header
        className="sticky top-0 z-10 glass px-6 py-4"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gradient">Canal de anuncios</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Publicá en tu canal de Telegram
            </p>
          </div>
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-4 max-w-2xl">

        {/* 1 — Plantillas */}
        <section
          className="glass rounded-2xl p-5"
        >
          <p
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--text)' }}
          >
            ⚡ Plantillas rápidas
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyTemplate(buildDailyTemplate(products))}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: 'var(--primary-dim)',
                color:           'var(--primary)',
                border:          '1px solid var(--border-glow)',
              }}
            >
              📅 Anuncio diario
            </button>
            <button
              onClick={() => applyTemplate(buildOfferTemplate(products))}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: 'rgba(255,176,32,0.08)',
                color:           'var(--warning)',
                border:          '1px solid rgba(255,176,32,0.2)',
              }}
            >
              🔥 Oferta especial
            </button>
            <button
              onClick={() => applyTemplate(buildReminderTemplate())}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold"
              style={{
                backgroundColor: 'rgba(255,176,32,0.08)',
                color:           'var(--warning)',
                border:          '1px solid rgba(255,176,32,0.2)',
              }}
            >
              ⏰ Recordatorio
            </button>
            <button
              disabled
              title="Próximamente"
              className="flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-medium text-purple-400 cursor-not-allowed dark:border-purple-900 dark:bg-purple-950/30 dark:text-purple-600"
            >
              ✨ Generar con IA
              <span className="rounded-full bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-500 dark:bg-purple-900/50">
                Próx.
              </span>
            </button>
          </div>
        </section>

        {/* 2 — Selector de productos */}
        <section
          className="glass rounded-2xl p-5"
        >
          <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
            🛒 Agregar productos al mensaje
          </p>
          {loadingP ? (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Cargando productos…</p>
          ) : activeProducts.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>No hay productos activos.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {activeProducts.map(p => {
                const on = selected.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProduct(p)}
                    className="flex flex-col items-start rounded-xl border p-3 text-left transition-colors"
                    style={
                      on
                        ? { backgroundColor: 'var(--primary-dim)', borderColor: 'var(--primary)' }
                        : { backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }
                    }
                  >
                    <span
                      className="text-xs font-semibold"
                      style={{ color: on ? 'var(--primary)' : 'var(--text)' }}
                    >
                      {on ? '✓ ' : ''}{p.name}
                    </span>
                    <span className="mt-0.5 text-xs" style={{ color: 'var(--muted)' }}>
                      ${p.unitPrice}/{p.unitLabel}
                    </span>
                    {p.inventory && (
                      <span className="mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>
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
          className="glass rounded-2xl p-5 flex flex-col gap-3"
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            ✏️ Mensaje
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'Escribí tu anuncio o usá una plantilla ↑'}
            rows={7}
            maxLength={MAX_CHARS}
            className="w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none"
            style={{
              backgroundColor: 'var(--surface)',
              borderColor:     'var(--border)',
              color:           'var(--text)',
              fontFamily:      'var(--font-mono)',
            }}
          />

          <div className="flex items-center justify-between">
            <span
              className="text-xs"
              style={{ color: charsLeft < 200 ? 'var(--warning)' : 'var(--muted)' }}
            >
              {charsLeft} caracteres restantes
            </span>
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="rounded-xl px-6 py-2 text-sm font-semibold disabled:opacity-50"
              className="bg-gradient-teal-violet shadow-glow text-white"
            >
              {sending ? 'Publicando…' : '📤 Publicar en canal'}
            </button>
          </div>

          {error != null && (
            <p
              className="rounded-xl px-3 py-2.5 text-sm"
              style={{ backgroundColor: 'rgba(255,61,85,0.08)', color: 'var(--error)', border: '1px solid rgba(255,61,85,0.2)' }}
            >
              {error}
            </p>
          )}
        </form>

        {/* 4 — Historial */}
        {history.length > 0 && (
          <section
            className="glass rounded-2xl p-4"
          >
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted)' }}
            >
              Publicados esta sesión
            </p>
            <div className="flex flex-col gap-3">
              {history.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl border p-3"
                  style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                >
                  <p
                    className="whitespace-pre-wrap text-sm"
                    style={{ color: 'var(--text)' }}
                  >
                    {item.text}
                  </p>
                  <p className="mt-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                    ✅ Enviado a las{' '}
                    {item.sentAt.toLocaleTimeString('es-CU', { hour: '2-digit', minute: '2-digit' })}
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
