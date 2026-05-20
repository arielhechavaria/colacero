'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const API_BASE = ''

type AiType = 'offer' | 'fresh' | 'reminder' | 'thank-you' | 'daily' | 'custom'
type AiTone = 'casual' | 'formal' | 'friendly'

const TYPES: { id: AiType; icon: string; label: string }[] = [
  { id: 'daily',      icon: '📅', label: 'Productos del día' },
  { id: 'offer',      icon: '🔥', label: 'Oferta especial' },
  { id: 'fresh',      icon: '🆕', label: 'Stock fresco' },
  { id: 'reminder',   icon: '⏰', label: 'Recordatorio' },
  { id: 'thank-you',  icon: '🙏', label: 'Agradecimiento' },
  { id: 'custom',     icon: '✨', label: 'Personalizado' },
]

const TONES: { id: AiTone; label: string; desc: string }[] = [
  { id: 'casual',   label: 'Cubano cercano', desc: 'Como hablándole a un vecino' },
  { id: 'friendly', label: 'Entre amigos',   desc: 'Divertido pero respetuoso' },
  { id: 'formal',   label: 'Profesional',    desc: 'Amable pero sin acartonarse' },
]

interface Props {
  open:            boolean
  onClose:         () => void
  onSelect:        (text: string) => void
  productIds:      string[]
  productNames?:   string[]
}

function csrfHeader(): Record<string, string> {
  if (typeof document === 'undefined') return {}
  const m = document.cookie.match(/(?:^|;\s*)cc_csrf=([^;]+)/)
  return m ? { 'X-CSRF-Token': decodeURIComponent(m[1]!) } : {}
}

export function AnnouncementAiModal({ open, onClose, onSelect, productIds, productNames = [] }: Props) {
  const [type,        setType]        = useState<AiType>('offer')
  const [tone,        setTone]        = useState<AiTone>('casual')
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading,     setLoading]     = useState(false)
  const [variants,    setVariants]    = useState<string[]>([])
  const [error,       setError]       = useState<string | null>(null)

  if (!open) return null

  async function generate() {
    setLoading(true)
    setError(null)
    setVariants([])
    try {
      const res = await fetch(`${API_BASE}/api/owner/announcements/ai-generate`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
        credentials: 'include',
        body:        JSON.stringify({
          type,
          tone,
          productIds: productIds.slice(0, 10),
          ...(type === 'custom' ? { customPrompt: customPrompt.trim() } : {}),
        }),
      })
      const data = await res.json() as { variants?: string[]; error?: string; message?: string }
      if (!res.ok) {
        if (data.error === 'ai_not_configured') {
          setError(data.message ?? 'IA no configurada en el servidor.')
        } else {
          setError(data.message ?? data.error ?? 'Error al generar')
        }
        return
      }
      setVariants(data.variants ?? [])
    } catch {
      setError('Error de red')
    } finally {
      setLoading(false)
    }
  }

  function pickVariant(text: string) {
    onSelect(text)
    onClose()
    toast.success('Variante aplicada al editor')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="glass relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6"
        style={{ border: '1px solid var(--glass-border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>✨ Generar con IA</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Claude genera 3 variantes para que elijas la mejor.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none"
            style={{ color: 'var(--muted)' }}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Type selector */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Tipo de mensaje
        </p>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TYPES.map((t) => {
            const active = type === t.id
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className="flex items-center gap-2 rounded-xl border p-3 text-left transition-colors"
                style={
                  active
                    ? { backgroundColor: 'var(--primary-dim)', borderColor: 'var(--primary)' }
                    : { backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }
                }
              >
                <span className="text-lg">{t.icon}</span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: active ? 'var(--primary)' : 'var(--text)' }}
                >
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tone selector */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          Tono
        </p>
        <div className="mb-4 grid gap-2 sm:grid-cols-3">
          {TONES.map((t) => {
            const active = tone === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className="rounded-xl border p-3 text-left transition-colors"
                style={
                  active
                    ? { backgroundColor: 'var(--primary-dim)', borderColor: 'var(--primary)' }
                    : { backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }
                }
              >
                <p
                  className="text-xs font-semibold"
                  style={{ color: active ? 'var(--primary)' : 'var(--text)' }}
                >
                  {t.label}
                </p>
                <p className="mt-0.5 text-[10px]" style={{ color: 'var(--muted)' }}>
                  {t.desc}
                </p>
              </button>
            )
          })}
        </div>

        {/* Custom prompt */}
        {type === 'custom' && (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Instrucciones para la IA
            </p>
            <Textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Ej: Anunciar que mañana es feriado y abrimos solo en horario de mañana…"
              rows={3}
              maxLength={500}
              className="mb-4"
            />
          </>
        )}

        {/* Selected products info */}
        {productIds.length > 0 && (
          <p className="mb-4 rounded-lg border p-3 text-xs" style={{ borderColor: 'var(--glass-border)', color: 'var(--muted)' }}>
            💡 La IA va a tener en cuenta los <strong>{productIds.length} productos</strong> que tenés seleccionados
            {productNames.length > 0 && `: ${productNames.slice(0, 3).join(', ')}${productNames.length > 3 ? '…' : ''}`}.
          </p>
        )}

        {/* Generate button */}
        {variants.length === 0 && (
          <Button
            onClick={() => void generate()}
            disabled={loading || (type === 'custom' && !customPrompt.trim())}
            className="w-full bg-gradient-teal-violet shadow-glow hover:opacity-90"
          >
            {loading ? 'Generando con Claude…' : '✨ Generar 3 variantes'}
          </Button>
        )}

        {error && (
          <p className="mt-3 rounded-xl px-4 py-2.5 text-sm" style={{ backgroundColor: 'rgba(220,38,38,0.1)', color: 'var(--error)', border: '1px solid rgba(220,38,38,0.2)' }}>
            {error}
          </p>
        )}

        {/* Variants */}
        {variants.length > 0 && (
          <div className="mt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Variantes generadas — elegí una
            </p>
            <div className="space-y-3">
              {variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => pickVariant(v)}
                  className="block w-full rounded-2xl border p-4 text-left transition-all hover:border-[var(--primary)]"
                  style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold" style={{ color: 'var(--primary)' }}>
                      VARIANTE {i + 1}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                      {v.length} chars
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                    {v}
                  </p>
                  <p className="mt-2 text-[11px] underline" style={{ color: 'var(--primary)' }}>
                    Usar esta →
                  </p>
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              onClick={() => { setVariants([]); setError(null) }}
              className="mt-4 w-full"
            >
              ↻ Generar nuevas variantes
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
