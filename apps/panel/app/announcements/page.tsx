'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  getProducts,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  sendAnnouncement,
  type Product,
  type Announcement,
  type AnnouncementStatus,
  isAuthenticatedClient,
} from '../../lib/api'
import { TEMPLATES, type TemplateDef } from '../../lib/announcement-templates'
import { AnnouncementPreview } from '../../components/announcement-preview'
import { AnnouncementAiModal } from '../../components/announcement-ai-modal'
import { EmptyState }   from '@/components/empty-state'
import { Button }       from '@/components/ui/button'
import { Textarea }     from '@/components/ui/textarea'
import { Badge }        from '@/components/ui/badge'
import { Skeleton }     from '@/components/ui/skeleton'

const MAX_CHARS = 4096

const statusLabel: Record<AnnouncementStatus, string> = {
  DRAFT:     'Borrador',
  SCHEDULED: 'Programado',
  SENDING:   'Enviando',
  SENT:      'Enviado',
  FAILED:    'Fallido',
  CANCELLED: 'Cancelado',
}

const statusColor: Record<AnnouncementStatus, string> = {
  DRAFT:     'bg-slate-500/15 text-slate-400 border-slate-500/30',
  SCHEDULED: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  SENDING:   'bg-amber-500/15 text-amber-400 border-amber-500/30',
  SENT:      'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  FAILED:    'bg-rose-500/15 text-rose-400 border-rose-500/30',
  CANCELLED: 'bg-slate-500/15 text-slate-500 border-slate-500/30',
}

function formatWhen(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('es-CU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AnnouncementsPage() {
  const router   = useRouter()
  const tokenRef = useRef<string | null>(null)

  // Editor state
  const [text,         setText]         = useState('')
  const [selectedTpl,  setSelectedTpl]  = useState<TemplateDef | null>(null)
  const [selectedProd, setSelectedProd] = useState<Set<string>>(new Set())
  const [scheduledAt,  setScheduledAt]  = useState<string>('') // datetime-local format

  // Data
  const [products,      setProducts]      = useState<Product[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loadingP,      setLoadingP]      = useState(true)
  const [loadingA,      setLoadingA]      = useState(true)

  // UI
  const [sending,    setSending]    = useState(false)
  const [previewMode, setPreviewMode] = useState<'text' | 'png'>('text')
  const [historyFilter, setHistoryFilter] = useState<AnnouncementStatus | 'ALL'>('ALL')
  const [aiModalOpen, setAiModalOpen] = useState(false)

  useEffect(() => {
    const token = (isAuthenticatedClient() ? '1' : null)
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token

    void getProducts(token).then(setProducts).catch(() => setProducts([])).finally(() => setLoadingP(false))
    void reloadAnnouncements()
  }, [router])

  async function reloadAnnouncements() {
    setLoadingA(true)
    try {
      setAnnouncements(await getAnnouncements(100))
    } catch {
      toast.error('Error al cargar historial')
    } finally {
      setLoadingA(false)
    }
  }

  // ── Template + product handling ────────────────────────────────────────────
  function applyTemplate(tpl: TemplateDef) {
    setSelectedTpl(tpl)
    const selProds = products.filter((p) => selectedProd.has(p.id))
    const generated = tpl.build({
      products,
      selectedProducts: selProds,
      catalogUrl: typeof window !== 'undefined'
        ? `${window.location.protocol}//${window.location.hostname.replace('panel.', '')}/`
        : '',
    })
    setText(generated)
  }

  function toggleProduct(p: Product) {
    setSelectedProd((prev) => {
      const next = new Set(prev)
      if (next.has(p.id)) next.delete(p.id)
      else next.add(p.id)
      // Re-apply template si hay uno activo (regenera el texto con la selección)
      if (selectedTpl) {
        const selProds = products.filter((x) => next.has(x.id))
        setText(selectedTpl.build({
          products,
          selectedProducts: selProds,
          catalogUrl: typeof window !== 'undefined'
            ? `${window.location.protocol}//${window.location.hostname.replace('panel.', '')}/`
            : '',
        }))
      }
      return next
    })
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handlePublish(e: React.FormEvent, sendNow: boolean) {
    e.preventDefault()
    if (!text.trim()) return

    setSending(true)
    try {
      const scheduled = scheduledAt && !sendNow ? new Date(scheduledAt).toISOString() : undefined

      const ann = await createAnnouncement({
        text:        text.trim(),
        template:    selectedTpl?.id,
        productIds:  Array.from(selectedProd),
        scheduledAt: scheduled,
        sendNow:     sendNow,
      })

      const msg = sendNow ? 'Publicado en el canal' : scheduled ? 'Programado correctamente' : 'Guardado como borrador'
      toast.success(msg)

      // Reset editor
      setText('')
      setSelectedTpl(null)
      setSelectedProd(new Set())
      setScheduledAt('')
      await reloadAnnouncements()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al publicar')
    } finally {
      setSending(false)
    }
  }

  async function handleSendDraft(id: string) {
    try {
      await sendAnnouncement(id)
      toast.success('Anuncio enviado')
      await reloadAnnouncements()
    } catch {
      toast.error('Error al enviar')
    }
  }

  async function handleCancelAnnouncement(id: string) {
    if (!confirm('¿Cancelar este anuncio?')) return
    try {
      await deleteAnnouncement(id)
      toast.success('Cancelado')
      await reloadAnnouncements()
    } catch {
      toast.error('Error al cancelar')
    }
  }

  async function handleRetry(a: Announcement) {
    try {
      await sendAnnouncement(a.id)
      toast.success('Reintentando…')
      await reloadAnnouncements()
    } catch {
      toast.error('Error al reintentar')
    }
  }

  const charsLeft      = MAX_CHARS - text.length
  const activeProducts = products.filter((p) => p.isActive)

  const filteredHistory = useMemo(
    () => historyFilter === 'ALL'
      ? announcements
      : announcements.filter((a) => a.status === historyFilter),
    [announcements, historyFilter],
  )

  const STATUS_VALUES: AnnouncementStatus[] = ['SENT', 'SCHEDULED', 'DRAFT', 'FAILED', 'CANCELLED']

  return (
    <main className="min-h-screen">
      <header
        className="sticky top-0 z-10 glass px-6 py-4"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gradient">Anuncios</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Publicá mensajes en tu canal de Telegram
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 lg:px-6 lg:grid lg:grid-cols-[1fr_400px] lg:gap-6 lg:items-start">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COLUMNA IZQUIERDA: Editor                                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4">

          {/* Plantillas */}
          <section className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                ⚡ Plantillas
              </p>
              <Button
                type="button"
                onClick={() => setAiModalOpen(true)}
                className="bg-gradient-teal-violet shadow-glow hover:opacity-90 text-xs h-auto py-1.5 px-3"
              >
                ✨ Generar con IA
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TEMPLATES.map((tpl) => {
                const active = selectedTpl?.id === tpl.id
                return (
                  <button
                    key={tpl.id}
                    onClick={() => applyTemplate(tpl)}
                    className="flex flex-col items-start rounded-xl border p-3 text-left transition-all hover:border-[var(--primary)]"
                    style={
                      active
                        ? { backgroundColor: 'var(--primary-dim)', borderColor: 'var(--primary)' }
                        : { backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }
                    }
                  >
                    <span className="text-lg">{tpl.icon}</span>
                    <span
                      className="mt-1 text-xs font-semibold leading-tight"
                      style={{ color: active ? 'var(--primary)' : 'var(--text)' }}
                    >
                      {tpl.name}
                    </span>
                    <span className="mt-0.5 text-[10px] leading-tight" style={{ color: 'var(--muted)' }}>
                      {tpl.tagline}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Productos */}
          <section className="glass rounded-2xl p-5">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
              🛒 Productos a destacar
              {selectedProd.size > 0 && (
                <Badge className="ml-2 bg-[var(--primary-dim)] text-[var(--primary)] border-[var(--border-glow)]">
                  {selectedProd.size}
                </Badge>
              )}
            </p>
            {loadingP ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : activeProducts.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>No hay productos activos.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {activeProducts.map((p) => {
                  const on = selectedProd.has(p.id)
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
                      <span className="text-xs font-semibold" style={{ color: on ? 'var(--primary)' : 'var(--text)' }}>
                        {on ? '✓ ' : ''}{p.name}
                      </span>
                      <span className="mt-0.5 text-[10px]" style={{ color: 'var(--muted)' }}>
                        ${p.unitPrice}/{p.unitLabel}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Editor */}
          <section className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                ✏️ Mensaje
              </p>
              <span className="text-xs" style={{ color: charsLeft < 200 ? 'var(--warning)' : 'var(--muted)' }}>
                {charsLeft} chars
              </span>
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribí tu anuncio o usá una plantilla ↑"
              rows={8}
              maxLength={MAX_CHARS}
              className="resize-none font-mono"
            />

            {/* Schedule */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                🕐 Programar para:
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="rounded-lg border bg-transparent px-3 py-1.5 text-sm"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
              />
              {scheduledAt && (
                <button onClick={() => setScheduledAt('')} className="text-xs underline" style={{ color: 'var(--muted)' }}>
                  Limpiar
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={(e) => void handlePublish(e, true)}
                disabled={sending || !text.trim()}
                className="bg-gradient-teal-violet shadow-glow hover:opacity-90"
              >
                {sending ? 'Enviando…' : '📤 Publicar ahora'}
              </Button>
              {scheduledAt && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => void handlePublish(e, false)}
                  disabled={sending || !text.trim()}
                >
                  🕐 Programar
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={(e) => void handlePublish(e, false)}
                disabled={sending || !text.trim()}
              >
                💾 Guardar borrador
              </Button>
            </div>
          </section>

        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* COLUMNA DERECHA: Preview + Historial                                 */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <div className="mt-4 flex flex-col gap-4 lg:mt-0">

          {/* Preview */}
          <section className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                👁 Preview
              </p>
              <div className="flex rounded-lg border p-0.5" style={{ borderColor: 'var(--border)' }}>
                <button
                  onClick={() => setPreviewMode('text')}
                  className="rounded px-2 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: previewMode === 'text' ? 'var(--primary-dim)' : 'transparent',
                    color:           previewMode === 'text' ? 'var(--primary)' : 'var(--muted)',
                  }}
                >
                  Texto
                </button>
                <button
                  onClick={() => setPreviewMode('png')}
                  className="rounded px-2 py-1 text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: previewMode === 'png' ? 'var(--primary-dim)' : 'transparent',
                    color:           previewMode === 'png' ? 'var(--primary)' : 'var(--muted)',
                  }}
                >
                  Imagen (próx.)
                </button>
              </div>
            </div>
            <AnnouncementPreview text={text} mode={previewMode} />
          </section>

          {/* Historial */}
          <section className="glass rounded-2xl p-5">
            <p className="text-sm font-semibold mb-3" style={{ color: 'var(--text)' }}>
              📜 Historial
            </p>

            {/* Filter chips */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setHistoryFilter('ALL')}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all"
                style={{
                  backgroundColor: historyFilter === 'ALL' ? 'var(--primary-dim)' : 'transparent',
                  border:          '1px solid var(--glass-border)',
                  color:           historyFilter === 'ALL' ? 'var(--primary)' : 'var(--muted)',
                }}
              >
                Todos ({announcements.length})
              </button>
              {STATUS_VALUES.map((s) => {
                const count = announcements.filter((a) => a.status === s).length
                if (count === 0) return null
                return (
                  <button
                    key={s}
                    onClick={() => setHistoryFilter(s)}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all"
                    style={{
                      backgroundColor: historyFilter === s ? 'var(--primary-dim)' : 'transparent',
                      border:          '1px solid var(--glass-border)',
                      color:           historyFilter === s ? 'var(--primary)' : 'var(--muted)',
                    }}
                  >
                    {statusLabel[s]} ({count})
                  </button>
                )
              })}
            </div>

            {loadingA ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
            ) : filteredHistory.length === 0 ? (
              <EmptyState
                icon="📤"
                title="Sin anuncios"
                description="Cuando publiques o programes un anuncio, va a aparecer acá."
              />
            ) : (
              <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh] pr-1">
                {filteredHistory.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl border p-3"
                    style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <Badge className={statusColor[a.status]}>{statusLabel[a.status]}</Badge>
                      <span className="text-[10px]" style={{ color: 'var(--muted)' }}>
                        {a.status === 'SCHEDULED' && a.scheduledAt
                          ? `Para ${formatWhen(a.scheduledAt)}`
                          : a.status === 'SENT' && a.sentAt
                            ? `Enviado ${formatWhen(a.sentAt)}`
                            : formatWhen(a.createdAt)}
                      </span>
                    </div>
                    <p
                      className="whitespace-pre-wrap break-words text-xs"
                      style={{ color: 'var(--text)', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                    >
                      {a.text}
                    </p>
                    {a.errorMessage && (
                      <p className="mt-2 rounded px-2 py-1 text-[10px]" style={{ backgroundColor: 'rgba(248,113,113,0.1)', color: 'var(--error)' }}>
                        {a.errorMessage}
                      </p>
                    )}
                    <div className="mt-2 flex gap-1.5">
                      {(a.status === 'DRAFT' || a.status === 'SCHEDULED') && (
                        <>
                          <button onClick={() => void handleSendDraft(a.id)} className="text-[10px] underline" style={{ color: 'var(--primary)' }}>
                            Enviar ahora
                          </button>
                          <button onClick={() => void handleCancelAnnouncement(a.id)} className="text-[10px] underline" style={{ color: 'var(--muted)' }}>
                            Cancelar
                          </button>
                        </>
                      )}
                      {a.status === 'FAILED' && (
                        <button onClick={() => void handleRetry(a)} className="text-[10px] underline" style={{ color: 'var(--primary)' }}>
                          Reintentar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* AI Modal */}
      <AnnouncementAiModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onSelect={(generatedText) => {
          setText(generatedText)
          setSelectedTpl(null)
        }}
        productIds={Array.from(selectedProd)}
        productNames={products.filter((p) => selectedProd.has(p.id)).map((p) => p.name)}
      />
    </main>
  )
}
