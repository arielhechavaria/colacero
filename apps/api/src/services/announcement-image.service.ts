/**
 * Generación de PNG del anuncio usando Satori + Resvg.
 *
 * Las fuentes Inter (Regular + Bold + Black) se descargan lazy de Google Fonts
 * en el primer uso y se cachean en memoria para los siguientes.
 *
 * Output: PNG 1080x1080 (square — ideal para Telegram).
 */

import path from 'node:path'
import { mkdir, writeFile } from 'node:fs/promises'
import { env } from '@colacero/env'

// Tipo mínimo para nodos de Satori (no necesitamos React)
type SatoriNode = {
  type: string
  props: {
    style?: Record<string, unknown>
    children?: unknown
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Font loader (lazy + cached)
// ──────────────────────────────────────────────────────────────────────────────

const FONT_URLS = {
  regular: 'https://github.com/rsms/inter/raw/v4.0/docs/font-files/Inter-Regular.otf',
  semibold: 'https://github.com/rsms/inter/raw/v4.0/docs/font-files/Inter-SemiBold.otf',
  bold:    'https://github.com/rsms/inter/raw/v4.0/docs/font-files/Inter-Bold.otf',
  black:   'https://github.com/rsms/inter/raw/v4.0/docs/font-files/Inter-Black.otf',
}

interface FontCache {
  regular?:  ArrayBuffer
  semibold?: ArrayBuffer
  bold?:     ArrayBuffer
  black?:    ArrayBuffer
}

const fontCache: FontCache = {}

async function loadFont(key: keyof typeof FONT_URLS): Promise<ArrayBuffer> {
  if (fontCache[key]) return fontCache[key]!
  const res = await fetch(FONT_URLS[key])
  if (!res.ok) throw new Error(`font_fetch_failed: ${key} (${res.status})`)
  const buf = await res.arrayBuffer()
  fontCache[key] = buf
  return buf
}

async function loadFonts() {
  const [regular, semibold, bold, black] = await Promise.all([
    loadFont('regular'),
    loadFont('semibold'),
    loadFont('bold'),
    loadFont('black'),
  ])
  return [
    { name: 'Inter', data: regular,  weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: semibold, weight: 600 as const, style: 'normal' as const },
    { name: 'Inter', data: bold,     weight: 700 as const, style: 'normal' as const },
    { name: 'Inter', data: black,    weight: 900 as const, style: 'normal' as const },
  ]
}

// ──────────────────────────────────────────────────────────────────────────────
// Layouts JSX
// ──────────────────────────────────────────────────────────────────────────────

export type PngLayout = 'list' | 'hero-product' | 'badge' | 'notice'

export interface AnnouncementImageData {
  businessName: string
  businessSlug: string
  title:        string
  subtitle?:    string | undefined
  body?:        string | undefined
  products?:    Array<{ name: string; price: number; unit: string }> | undefined
  highlightProduct?: { name: string; price: number; unit: string } | undefined
  callout?:     string | undefined
  layout:       PngLayout
}

const GRADIENT_BG = 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'
const GRADIENT_BRAND = 'linear-gradient(135deg, #14B8A6 0%, #8B5CF6 100%)'

function Header({ businessName }: { businessName: string }): SatoriNode {
  return {
    type: 'div',
    props: {
      style: {
        display:    'flex',
        alignItems: 'center',
        gap:        '16px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              width:           '64px',
              height:          '64px',
              borderRadius:    '18px',
              background:      GRADIENT_BRAND,
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              fontSize:        '36px',
              fontWeight:      900,
              color:           'white',
            },
            children: businessName[0]?.toUpperCase() ?? 'C',
          },
        },
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: '32px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' },
                  children: businessName,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '18px', fontWeight: 500, color: '#94a3b8' },
                  children: 'colacero.com',
                },
              },
            ],
          },
        },
      ],
    },
  } as SatoriNode
}

function Footer({ slug }: { slug: string }): SatoriNode {
  return {
    type: 'div',
    props: {
      style: {
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'space-between',
        marginTop:       '24px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              padding:         '12px 24px',
              borderRadius:    '14px',
              background:      GRADIENT_BRAND,
              color:           'white',
              fontSize:        '24px',
              fontWeight:      700,
              display:         'flex',
            },
            children: '🛒 Pedí ahora',
          },
        },
        {
          type: 'div',
          props: {
            style: { color: '#94a3b8', fontSize: '20px', fontWeight: 500, display: 'flex' },
            children: `${slug}.colacero.com`,
          },
        },
      ],
    },
  } as SatoriNode
}

function buildJsx(d: AnnouncementImageData): SatoriNode {
  // Background con orbs
  const orbs: SatoriNode[] = [
    {
      type: 'div',
      props: {
        style: {
          position:        'absolute',
          top:             '-120px',
          left:            '-120px',
          width:           '500px',
          height:          '500px',
          background:      'radial-gradient(circle, rgba(20,184,166,0.30) 0%, transparent 70%)',
        },
      },
    } as SatoriNode,
    {
      type: 'div',
      props: {
        style: {
          position:        'absolute',
          bottom:          '-120px',
          right:           '-120px',
          width:           '500px',
          height:          '500px',
          background:      'radial-gradient(circle, rgba(139,92,246,0.30) 0%, transparent 70%)',
        },
      },
    } as SatoriNode,
  ]

  // Body content por layout
  const bodyContent: SatoriNode = bodyForLayout(d)

  return {
    type: 'div',
    props: {
      style: {
        width:           '1080px',
        height:          '1080px',
        background:      GRADIENT_BG,
        color:           'white',
        fontFamily:      'Inter',
        padding:         '60px',
        display:         'flex',
        flexDirection:   'column',
        justifyContent:  'space-between',
        position:        'relative',
      },
      children: [
        ...orbs,
        // Top
        Header({ businessName: d.businessName }),
        // Middle (body)
        bodyContent,
        // Footer
        Footer({ slug: d.businessSlug }),
      ],
    },
  } as SatoriNode
}

function bodyForLayout(d: AnnouncementImageData): SatoriNode {
  // Callout badge
  const callout = d.callout
    ? {
        type: 'div',
        props: {
          style: {
            alignSelf:       'flex-start',
            display:         'flex',
            padding:         '8px 20px',
            borderRadius:    '999px',
            background:      'rgba(20,184,166,0.15)',
            border:          '2px solid rgba(20,184,166,0.4)',
            color:           '#5eead4',
            fontSize:        '22px',
            fontWeight:      700,
            letterSpacing:   '0.05em',
            textTransform:   'uppercase',
            marginBottom:    '24px',
          },
          children: d.callout,
        },
      } as SatoriNode
    : null

  // Title (siempre)
  const title = {
    type: 'div',
    props: {
      style: {
        fontSize:      d.title.length > 30 ? '68px' : '88px',
        fontWeight:    900,
        lineHeight:    1.05,
        letterSpacing: '-0.03em',
        color:         'white',
        marginBottom:  '16px',
        display:       'flex',
      },
      children: d.title,
    },
  } as SatoriNode

  // Subtitle
  const subtitle = d.subtitle
    ? {
        type: 'div',
        props: {
          style: {
            fontSize:    '32px',
            fontWeight:  500,
            color:       '#cbd5e1',
            marginBottom: '24px',
            display:     'flex',
          },
          children: d.subtitle,
        },
      } as SatoriNode
    : null

  // Layout-specific content
  let extra: SatoriNode | null = null

  if (d.layout === 'hero-product' && d.highlightProduct) {
    extra = {
      type: 'div',
      props: {
        style: {
          display:         'flex',
          flexDirection:   'column',
          padding:         '32px',
          borderRadius:    '28px',
          background:      'rgba(255,255,255,0.06)',
          border:          '1px solid rgba(255,255,255,0.12)',
          marginTop:       '16px',
        },
        children: [
          {
            type: 'div',
            props: {
              style: { fontSize: '52px', fontWeight: 800, color: 'white', display: 'flex', marginBottom: '8px' },
              children: d.highlightProduct.name,
            },
          },
          {
            type: 'div',
            props: {
              style: {
                fontSize:        '64px',
                fontWeight:      900,
                background:      GRADIENT_BRAND,
                backgroundClip:  'text',
                color:           'transparent',
                display:         'flex',
              },
              children: `$${d.highlightProduct.price}/${d.highlightProduct.unit}`,
            },
          },
        ],
      },
    } as SatoriNode
  }

  if (d.layout === 'list' && d.products && d.products.length > 0) {
    extra = {
      type: 'div',
      props: {
        style: {
          display:         'flex',
          flexDirection:   'column',
          marginTop:       '16px',
          gap:             '12px',
        },
        children: d.products.slice(0, 6).map((p) => ({
          type: 'div',
          props: {
            style: {
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'space-between',
              padding:         '16px 24px',
              borderRadius:    '16px',
              background:      'rgba(255,255,255,0.06)',
              border:          '1px solid rgba(255,255,255,0.12)',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: '28px', fontWeight: 600, color: 'white', display: 'flex' },
                  children: p.name,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: '28px', fontWeight: 700, color: '#5eead4', display: 'flex' },
                  children: `$${p.price}/${p.unit}`,
                },
              },
            ],
          },
        })),
      },
    } as SatoriNode
  }

  if (d.body && (d.layout === 'notice' || d.layout === 'badge')) {
    extra = {
      type: 'div',
      props: {
        style: {
          fontSize:    '28px',
          fontWeight:  500,
          lineHeight:  1.4,
          color:       '#cbd5e1',
          marginTop:   '16px',
          display:     'flex',
        },
        children: d.body,
      },
    } as SatoriNode
  }

  return {
    type: 'div',
    props: {
      style: {
        display:         'flex',
        flexDirection:   'column',
        flex:            1,
        justifyContent:  'center',
        position:        'relative',
        zIndex:          1,
      },
      children: [callout, title, subtitle, extra].filter(Boolean),
    },
  } as SatoriNode
}

// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────

export async function generateAnnouncementPng(
  announcementId: string,
  data:           AnnouncementImageData,
): Promise<{ publicPath: string; absoluteUrl: string }> {
  // Lazy imports — heavy modules
  const { default: satori } = await import('satori')
  const { Resvg } = await import('@resvg/resvg-js')

  const fonts = await loadFonts()
  const jsx = buildJsx(data)

  // 1. Satori → SVG (cast porque construimos nodos manualmente sin React JSX)
  const svg = await satori(jsx as unknown as Parameters<typeof satori>[0], {
    width:  1080,
    height: 1080,
    fonts,
  })

  // 2. Resvg → PNG buffer
  const resvg = new Resvg(svg, { background: 'transparent' })
  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  // 3. Save to disk
  const dir = path.resolve(env.UPLOAD_DIR, 'announcements')
  await mkdir(dir, { recursive: true })
  const filename = `${announcementId}.png`
  const filepath = path.join(dir, filename)
  await writeFile(filepath, pngBuffer)

  // 4. Build URLs
  const publicPath  = `/uploads/announcements/${filename}`
  const absoluteUrl = `${env.API_PUBLIC_URL.replace(/\/$/, '')}${publicPath}`

  return { publicPath, absoluteUrl }
}

// ──────────────────────────────────────────────────────────────────────────────
// Build AnnouncementImageData from text + context (heurística)
// ──────────────────────────────────────────────────────────────────────────────

export interface BuildImageDataInput {
  text:         string
  template?:    string | null
  business:     { name: string; slug: string }
  products?:    Array<{ name: string; unitPrice: number | string; unitLabel: string }>
}

export function buildImageDataFromAnnouncement(input: BuildImageDataInput): AnnouncementImageData {
  const lines = input.text.split('\n').filter((l) => l.trim())
  const firstLine  = (lines[0] ?? '').trim()
  const secondLine = (lines[1] ?? '').trim()

  // Templates conocidos → layout específico
  let layout: PngLayout = 'notice'
  if (input.template === 'daily' || input.template === 'fresh-arrival') layout = 'list'
  else if (input.template === 'offer') layout = 'hero-product'
  else if (input.template === 'low-stock') layout = 'badge'

  // Strip emoji prefix del título para que se vea más limpio
  const stripEmojiPrefix = (s: string) =>
    s.replace(/^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{1F900}-\u{1F9FF}🛒]+\s*/u, '').trim()

  const titleClean = stripEmojiPrefix(firstLine) || input.business.name

  // Callout: detectar palabras clave en la primera línea
  let callout: string | undefined
  if (/oferta|fuego|🔥/i.test(firstLine))            callout = '🔥 OFERTA'
  else if (/fresco|nuevo|🆕/i.test(firstLine))       callout = '🆕 NUEVO'
  else if (/recordatorio|⏰/i.test(firstLine))       callout = '⏰ RECORDATORIO'
  else if (/últim|⚠/i.test(firstLine))              callout = '⚠️ ÚLTIMAS'
  else if (/gracias|🙏/i.test(firstLine))           callout = '🙏 GRACIAS'
  else if (/cerrad|cerrar|🚪/i.test(firstLine))     callout = '🚪 AVISO'
  else if (/abierto|🟢/i.test(firstLine))           callout = '🟢 ABIERTO'
  else if (/disponib|productos|🛒/i.test(firstLine)) callout = '🛒 HOY'

  const products = input.products?.slice(0, 6).map((p) => ({
    name:  p.name,
    price: Number(p.unitPrice),
    unit:  p.unitLabel,
  }))

  // Body para layouts notice/badge: tomamos las líneas 2-3 sin emojis
  const body = lines.slice(1, 4)
    .filter((l) => !l.includes('http') && !l.startsWith('•') && !l.startsWith('✓'))
    .join(' ')
    .trim()

  return {
    businessName: input.business.name,
    businessSlug: input.business.slug,
    layout,
    callout,
    title:    titleClean,
    subtitle: secondLine && !secondLine.includes('http') ? stripEmojiPrefix(secondLine) : undefined,
    body:     body || undefined,
    products: layout === 'list' ? products : undefined,
    highlightProduct: layout === 'hero-product' && products && products.length > 0
      ? products[0]
      : undefined,
  }
}
