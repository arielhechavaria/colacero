import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'ColaCero — Recibí pedidos por Telegram. Cero comisiones.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width:           '100%',
          height:          '100%',
          display:         'flex',
          flexDirection:   'column',
          justifyContent:  'center',
          alignItems:      'center',
          background:      'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          color:           'white',
          fontFamily:      'Inter, system-ui, sans-serif',
          padding:         '80px',
          position:        'relative',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position:        'absolute',
            top:             '20%',
            left:            '15%',
            width:           '400px',
            height:          '400px',
            background:      'radial-gradient(circle, rgba(20,184,166,0.35) 0%, transparent 70%)',
            filter:          'blur(60px)',
          }}
        />
        <div
          style={{
            position:        'absolute',
            bottom:          '20%',
            right:           '15%',
            width:           '400px',
            height:          '400px',
            background:      'radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)',
            filter:          'blur(60px)',
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display:         'flex',
            alignItems:      'center',
            gap:             '16px',
            marginBottom:    '32px',
            position:        'relative',
          }}
        >
          <div
            style={{
              width:           '72px',
              height:          '72px',
              borderRadius:    '20px',
              background:      'linear-gradient(135deg, #14B8A6 0%, #8B5CF6 100%)',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        '44px',
              fontWeight:      900,
              color:           'white',
            }}
          >
            C
          </div>
          <div style={{ fontSize: '40px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            ColaCero
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize:        '72px',
            fontWeight:      900,
            lineHeight:      1.05,
            letterSpacing:   '-0.03em',
            textAlign:       'center',
            maxWidth:        '900px',
            position:        'relative',
          }}
        >
          Recibí pedidos por{' '}
          <span style={{ background: 'linear-gradient(135deg, #14B8A6, #8B5CF6)', backgroundClip: 'text', color: 'transparent' }}>
            Telegram
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize:        '36px',
            fontWeight:      600,
            color:           '#94a3b8',
            marginTop:       '20px',
            position:        'relative',
          }}
        >
          Cero comisiones · Gratis durante el beta
        </div>

        {/* URL */}
        <div
          style={{
            fontSize:        '24px',
            fontWeight:      500,
            color:           '#64748b',
            marginTop:       '48px',
            position:        'relative',
          }}
        >
          colacero.com
        </div>
      </div>
    ),
    { ...size },
  )
}
