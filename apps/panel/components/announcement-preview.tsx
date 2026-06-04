'use client'

/**
 * Preview de cómo se verá el anuncio en Telegram.
 * Modo "text": render del texto con estilo del chat de Telegram.
 * Modo "png": muestra el PNG generado (placeholder mientras no exista).
 */

interface Props {
  text:        string
  imageUrl?:   string | null
  pngUrl?:     string | null
  mode?:       'text' | 'png'
  businessName?: string
}

export function AnnouncementPreview({ text, imageUrl, pngUrl, mode = 'text', businessName }: Props) {
  return (
    <div
      className="rounded-3xl p-4 sm:p-5"
      style={{
        background: '#1d2733',  // estilo chat Telegram dark
        border:     '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>
        Preview · Telegram channel
      </p>

      {/* Bubble */}
      <div
        className="rounded-2xl px-4 py-3 max-w-md"
        style={{
          background: '#2a3441',
          color:      '#ecf0f1',
          fontSize:   '14px',
          lineHeight: '1.5',
          fontFamily: '-apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}
      >
        {/* Channel header inside bubble */}
        <div className="mb-2 flex items-center gap-2 pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg, #14B8A6, #8B5CF6)' }}
          >
            {businessName?.[0]?.toUpperCase() ?? 'C'}
          </div>
          <div>
            <p className="text-xs font-semibold leading-tight" style={{ color: '#fff' }}>
              {businessName ?? 'Tu canal'}
            </p>
            <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Canal · ahora
            </p>
          </div>
        </div>

        {/* PNG generated */}
        {mode === 'png' && (
          <div className="-mx-4 -mt-1 mb-2">
            {pngUrl ? (
              <img src={pngUrl} alt="Anuncio generado" className="w-full" />
            ) : (
              <div
                className="aspect-square w-full flex items-center justify-center text-sm"
                style={{
                  background: 'linear-gradient(135deg, rgba(20,184,166,0.15), rgba(139,92,246,0.15))',
                  color:      'rgba(255,255,255,0.4)',
                }}
              >
                🖼 Imagen se genera al publicar
              </div>
            )}
          </div>
        )}

        {/* User-attached image (separate from generated PNG) */}
        {mode === 'text' && imageUrl && (
          <div className="-mx-4 -mt-1 mb-2">
            <img src={imageUrl} alt="Imagen adjunta" className="w-full rounded-lg" />
          </div>
        )}

        {/* Texto */}
        <div className="whitespace-pre-wrap break-words" style={{ wordBreak: 'break-word' }}>
          {text || <span style={{ color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>El mensaje aparecerá acá…</span>}
        </div>

        {/* Botón inline simulado */}
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="mt-3 block rounded-lg py-2 text-center text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color:      '#5dafff',
          }}
        >
          🛒 Ver catálogo
        </a>

        {/* Time + views */}
        <div className="mt-2 flex items-center justify-end gap-2 text-[10px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          <span>👁 12</span>
          <span>{new Date().toLocaleTimeString('es-CU', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
    </div>
  )
}
