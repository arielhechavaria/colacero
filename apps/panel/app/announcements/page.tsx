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
  previewAnnouncementImage,
  regenerateAnnouncementImage,
  getMe,
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
  const [pngUrl,      setPngUrl]      = useState<string | null>(null)
  const [pngLoading,  setPngLoading]  = useState(false)
  const [businessSlug, setBusinessSlug] = useState<string>('')
  const [prodExpanded,    setProdExpanded]    = useState(true)
  const [historyExpanded, setHistoryExpanded] = useState(false)

  useEffect(() => {
    const token = (isAuthenticatedClient() ? '1' : null)
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token

    void getProducts(token).then(setProducts).catch(() => setProducts([])).finally(() => setLoadingP(false))
    void reloadAnnouncements()
    void getMe('').then((u) => setBusinessSlug(u.businessSlug ?? '')).catch(() => { /* noop */ })
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
  function buildCatalogUrl(): string {
    if (businessSlug) return `https://${businessSlug}.colacero.com/`
    // Fallback durante el primer load mientras no llega me
    return typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname.replace('panel.', '')}/`
      : ''
  }

  function applyTemplate(tpl: TemplateDef) {
    setSelectedTpl(tpl)

    // Para plantillas que muestran productos en la imagen, auto-seleccionar
    // los mismos que usa la plantilla para el texto — así texto e imagen quedan sync.
    let effectiveSelected = selectedProd
    if ((tpl.pngLayout === 'list' || tpl.pngLayout === 'hero-product') && selectedProd.size === 0) {
      const limit   = tpl.pngLayout === 'hero-product' ? 1 : 6
      const actives = products.filter((p) => p.isActive)
      const autoIds = new Set(actives.slice(0, limit).map((p) => p.id))
      setSelectedProd(autoIds)
      effectiveSelected = autoIds
    }

    const selProds = products.filter((p) => effectiveSelected.has(p.id))
    const generated = tpl.build({
      products,
      selectedProducts: selProds,
      catalogUrl: buildCatalogUrl(),
    })
    setText(generated)
    setPngUrl(null) // invalidar preview viejo
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
          catalogUrl: buildCatalogUrl(),
        }))
      }
      return next
    })
    setPngUrl(null) // invalidar preview viejo
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
      setPngUrl(null)
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

  async function handleGeneratePreview() {
    if (!text.trim()) return
    setPngLoading(true)
    try {
      const { url } = await previewAnnouncementImage({
        text:       text.trim(),
        template:   selectedTpl?.id,
        productIds: Array.from(selectedProd),
      })
      // Bust cache con timestamp
      setPngUrl(`${url}?t=${Date.now()}`)
      setPreviewMode('png')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar imagen')
    } finally {
      setPngLoading(false)
    }
  }

  async function handleRegenImage(id: string) {
    try {
      toast.info('Generando imagen…')
      await regenerateAnnouncementImage(id)
      toast.success('Imagen generada')
      await reloadAnnouncements()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al generar imagen')
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
        className="sticky top-0 z-10 px-6 py-5 border-b border-slate-200 bg-white flex items-center justify-between"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gradient">Anuncios</h1>
            <p className="text-sm text-slate-500">
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
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">
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
                    className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all hover:border-indigo-400 ${active ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-slate-200'}`}
                  >
                    <span className="text-lg">{tpl.icon}</span>
                    <span
                      className={`mt-1 text-xs font-semibold leading-tight ${active ? 'text-indigo-600' : 'text-slate-900'}`}
                    >
                      {tpl.name}
                    </span>
                    <span className="mt-0.5 text-[10px] leading-tight text-slate-500">
                      {tpl.tagline}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Productos */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <button
              type="button"
              onClick={() => setProdExpanded((v) => !v)}
              className="flex w-full items-center justify-between mb-3"
            >
              <p className="text-sm font-semibold flex items-center gap-1.5 text-slate-900">
                🛒 Productos a destacar
                {selectedProd.size > 0 && (
                  <Badge className="bg-[var(--primary-dim)] text-[var(--primary)] border-[var(--border-glow)]">
                    {selectedProd.size}
                  </Badge>
                )}
              </p>
              <span className={`text-xs transition-transform duration-200 text-slate-500 inline-block ${prodExpanded ? 'rotate-0' : '-rotate-90'}`}>▾</span>
            </button>
            {prodExpanded && (
              loadingP ? (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : activeProducts.length === 0 ? (
                <p className="text-xs text-slate-500">No hay productos activos.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {activeProducts.map((p) => {
                    const on = selectedProd.has(p.id)
                    return (
                      <button
                        key={p.id}
                        onClick={() => toggleProduct(p)}
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${on ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-slate-200'}`}
                      >
                        <span className={`text-xs font-semibold ${on ? 'text-indigo-600' : 'text-slate-900'}`}>
                          {on ? '✓ ' : ''}{p.name}
                        </span>
                        <span className="mt-0.5 text-[10px] text-slate-500">
                          ${p.unitPrice}/{p.unitLabel}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            )}
          </section>

          {/* Editor */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">
                ✏️ Mensaje
              </p>
              <span className={`text-xs ${charsLeft < 200 ? 'text-amber-600' : 'text-slate-500'}`}>
                {charsLeft} chars
              </span>
            </div>

            <Textarea
              value={text}
              onChange={(e) => {
                const newText = e.target.value
                setText(newText)
                if (pngUrl) setPngUrl(null)
                // Si el user editó manualmente, desactivar plantilla para que cambios
                // en productos no sobreescriban su edición
                if (selectedTpl) {
                  const selProds = products.filter((x) => selectedProd.has(x.id))
                  const expected = selectedTpl.build({
                    products,
                    selectedProducts: selProds,
                    catalogUrl: buildCatalogUrl(),
                  })
                  if (newText !== expected) setSelectedTpl(null)
                }
              }}
              placeholder="Escribí tu anuncio o usá una plantilla ↑"
              rows={8}
              maxLength={MAX_CHARS}
              className="resize-none font-mono"
            />

            {/* Schedule */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-slate-500">
                🕐 Programar para:
              </label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                suppressHydrationWarning
                min={new Date().toISOString().slice(0, 16)}
                className="rounded-lg border border-slate-200 bg-transparent px-3 py-1.5 text-sm text-slate-900"
              />
              {scheduledAt && (
                <button onClick={() => setScheduledAt('')} className="text-xs underline text-slate-500">
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
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-900">
                👁 Preview
              </p>
              <div className="flex rounded-lg border border-slate-200 p-0.5">
                <button
                  onClick={() => setPreviewMode('text')}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${previewMode === 'text' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
                >
                  Texto
                </button>
                <button
                  onClick={() => setPreviewMode('png')}
                  className={`rounded px-2 py-1 text-xs font-medium transition-colors ${previewMode === 'png' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500'}`}
                >
                  🎨 Imagen
                </button>
              </div>
            </div>
            <AnnouncementPreview text={text} mode={previewMode} pngUrl={pngUrl} />
            {previewMode === 'png' && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleGeneratePreview()}
                disabled={pngLoading || !text.trim()}
                className="mt-3 w-full text-xs"
              >
                {pngLoading ? 'Generando…' : pngUrl ? '🔄 Regenerar imagen' : '🎨 Generar imagen ahora'}
              </Button>
            )}
          </section>

          {/* Historial */}
          <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <button
              type="button"
              onClick={() => setHistoryExpanded((v) => !v)}
              className="flex w-full items-center justify-between mb-3"
            >
              <p className="text-sm font-semibold flex items-center gap-1.5 text-slate-900">
                📜 Historial
                {announcements.length > 0 && (
                  <Badge className="bg-[var(--primary-dim)] text-[var(--primary)] border-[var(--border-glow)]">
                    {announcements.length}
                  </Badge>
                )}
              </p>
              <span className={`text-xs transition-transform duration-200 text-slate-500 inline-block ${historyExpanded ? 'rotate-0' : '-rotate-90'}`}>▾</span>
            </button>

            {historyExpanded && (
            <>
            {/* Filter chips */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              <button
                onClick={() => setHistoryFilter('ALL')}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all border border-slate-200 ${historyFilter === 'ALL' ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent text-slate-500'}`}
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
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all border border-slate-200 ${historyFilter === s ? 'bg-indigo-50 text-indigo-600' : 'bg-transparent text-slate-500'}`}
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
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                  >
                    <div className="mb-1.5 flex items-start justify-between gap-2">
                      <Badge className={statusColor[a.status]}>{statusLabel[a.status]}</Badge>
                      <span className="text-[10px] text-slate-500">
                        {a.status === 'SCHEDULED' && a.scheduledAt
                          ? `Para ${formatWhen(a.scheduledAt)}`
                          : a.status === 'SENT' && a.sentAt
                            ? `Enviado ${formatWhen(a.sentAt)}`
                            : formatWhen(a.createdAt)}
                      </span>
                    </div>
                    <p
                      className="whitespace-pre-wrap break-words text-xs text-slate-900 line-clamp-4"
                    >
                      {a.text}
                    </p>
                    {a.errorMessage && (
                      <p className="mt-2 rounded px-2 py-1 text-[10px] bg-red-50 text-red-600">
                        {a.errorMessage}
                      </p>
                    )}
                    {a.generatedPng && (
                      <a href={a.generatedPng} target="_blank" rel="noopener noreferrer" className="mt-2 mb-2 block">
                        <img src={a.generatedPng} alt="Imagen del anuncio" className="rounded-lg w-24 h-24 object-cover" />
                      </a>
                    )}
                    <div className="mt-2 flex gap-1.5 flex-wrap">
                      {(a.status === 'DRAFT' || a.status === 'SCHEDULED') && (
                        <>
                          <button onClick={() => void handleSendDraft(a.id)} className="text-[10px] underline text-indigo-600">
                            Enviar ahora
                          </button>
                          <button onClick={() => void handleRegenImage(a.id)} className="text-[10px] underline text-indigo-600">
                            {a.generatedPng ? 'Regenerar imagen' : 'Generar imagen'}
                          </button>
                          <button onClick={() => void handleCancelAnnouncement(a.id)} className="text-[10px] underline text-slate-500">
                            Cancelar
                          </button>
                        </>
                      )}
                      {a.status === 'FAILED' && (
                        <button onClick={() => void handleRetry(a)} className="text-[10px] underline text-indigo-600">
                          Reintentar
                        </button>
                      )}
                      {a.status === 'SENT' && !a.generatedPng && (
                        <span className="text-[10px] text-slate-500">
                          Enviado como texto
                        </span>
                      )}
                      {a.status === 'SENT' && a.generatedPng && (
                        <span className="text-[10px] text-slate-500">
                          Enviado con imagen
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </>
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
