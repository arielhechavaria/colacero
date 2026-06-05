'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const API_BASE = ''

type AiType = 'offer' | 'fresh' | 'reminder' | 'thank-you' | 'daily' | 'custom'
type AiTone = 'casual' | 'formal' | 'friendly'

const TYPES: { id: AiType; icon: string; label: string }[] = [
  { id: 'daily',      icon: '📅', label: 'Productos del día' },
  { id: 'offer',      icon: '🔥', label: 'Oferta especial'   },
  { id: 'fresh',      icon: '🆕', label: 'Stock fresco'      },
  { id: 'reminder',   icon: '⏰', label: 'Recordatorio'      },
  { id: 'thank-you',  icon: '🙏', label: 'Agradecimiento'    },
  { id: 'custom',     icon: '✨', label: 'Personalizado'     },
]

const TONES: { id: AiTone; label: string; desc: string }[] = [
  { id: 'casual',   label: 'Cubano cercano', desc: 'Como hablándole a un vecino' },
  { id: 'friendly', label: 'Entre amigos',   desc: 'Divertido pero respetuoso'   },
  { id: 'formal',   label: 'Profesional',    desc: 'Amable pero sin acartonarse' },
]

interface Props {
  open:          boolean
  onClose:       () => void
  onSelect:      (text: string) => void
  productIds:    string[]
  productNames?: string[]
}

function csrfHeader(): Record<string, string> {
  if (typeof document === 'undefined') return {}
  const m = document.cookie.match(/(?:^|;\s*)cc_csrf=([^;]+)/)
  return m ? { 'X-CSRF-Token': decodeURIComponent(m[1]!) } : {}
}

export function AnnouncementAiModal({ open, onClose, onSelect, productIds, productNames = [] }: Props) {
  const [type,         setType]         = useState<AiType>('offer')
  const [tone,         setTone]         = useState<AiTone>('casual')
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading,      setLoading]      = useState(false)
  const [variants,     setVariants]     = useState<string[]>([])
  const [error,        setError]        = useState<string | null>(null)

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
        setError(data.message ?? data.error ?? 'Error al generar')
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
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white border border-white/[0.08] shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white">✨ Generar con IA</h2>
            <p className="text-sm text-slate-500">Claude genera 3 variantes para que elijas la mejor.</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-slate-400 hover:text-slate-600" aria-label="Cerrar">×</button>
        </div>

        {/* Type selector */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Tipo de mensaje</p>
        <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {TYPES.map((t) => {
            const active = type === t.id
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border p-3 text-left transition-colors',
                  active ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-white/[0.08] hover:border-white/20',
                )}
              >
                <span className="text-lg">{t.icon}</span>
                <span className={cn('text-xs font-semibold', active ? 'text-indigo-400' : 'text-slate-300')}>
                  {t.label}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tone selector */}
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Tono</p>
        <div className="mb-5 grid gap-2 sm:grid-cols-3">
          {TONES.map((t) => {
            const active = tone === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTone(t.id)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-colors',
                  active ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-white/[0.08] hover:border-white/20',
                )}
              >
                <p className={cn('text-xs font-semibold', active ? 'text-indigo-400' : 'text-slate-300')}>
                  {t.label}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500">{t.desc}</p>
              </button>
            )
          })}
        </div>

        {/* Custom prompt */}
        {type === 'custom' && (
          <>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Instrucciones para la IA</p>
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

        {/* Products info */}
        {productIds.length > 0 && (
          <p className="mb-4 rounded-lg border border-white/[0.08] bg-[#0B0F1A] p-3 text-xs text-slate-600">
            💡 La IA va a tener en cuenta los <strong>{productIds.length} productos</strong> seleccionados
            {productNames.length > 0 && `: ${productNames.slice(0, 3).join(', ')}${productNames.length > 3 ? '…' : ''}`}.
          </p>
        )}

        {/* Generate button */}
        {variants.length === 0 && (
          <Button
            onClick={() => void generate()}
            disabled={loading || (type === 'custom' && !customPrompt.trim())}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? 'Generando con Claude…' : '✨ Generar 3 variantes'}
          </Button>
        )}

        {error && (
          <p className="mt-3 rounded-xl px-4 py-2.5 text-sm bg-red-50 text-red-600 border border-red-200">
            {error}
          </p>
        )}

        {/* Variants */}
        {variants.length > 0 && (
          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Variantes generadas — elegí una
            </p>
            <div className="space-y-3">
              {variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => pickVariant(v)}
                  className="block w-full rounded-xl border border-white/[0.08] bg-white p-4 text-left transition-all hover:border-indigo-400 hover:shadow-sm"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-indigo-400">VARIANTE {i + 1}</span>
                    <span className="text-[11px] text-slate-400">{v.length} chars</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{v}</p>
                  <p className="mt-2 text-[11px] underline text-indigo-400">Usar esta →</p>
                </button>
              ))}
            </div>
            <Button variant="outline" onClick={() => { setVariants([]); setError(null) }} className="mt-4 w-full">
              ↻ Generar nuevas variantes
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
