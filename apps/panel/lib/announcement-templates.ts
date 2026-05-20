/**
 * Plantillas de anuncios. Cada plantilla genera un texto inicial usando datos
 * del negocio (productos activos, próxima ventana, etc.).
 *
 * Para reutilizarlas también en la generación de PNG, los datos se pasan
 * explícitamente — no se asume contexto global.
 */

import type { Product } from './api'

export interface TemplateContext {
  businessName?:  string
  catalogUrl?:    string
  products?:      Product[]
  selectedProducts?: Product[]
  nextWindow?: {
    date:      string  // YYYY-MM-DD
    startTime: string  // HH:MM
    endTime:   string
  } | null
}

export interface TemplateDef {
  id:          string
  icon:        string
  name:        string
  tagline:     string  // short description
  build:       (ctx: TemplateContext) => string
  /** Tags para distinguir layout del PNG generado */
  pngLayout:   'list' | 'hero-product' | 'badge' | 'notice'
}

const URL_LINE = (url?: string) => url ? `\n👉 ${url}` : ''

function topProducts(products: Product[] | undefined, n = 6): Product[] {
  if (!products) return []
  return products.filter((p) => p.isActive).slice(0, n)
}

export const TEMPLATES: TemplateDef[] = [
  {
    id:       'daily',
    icon:     '📅',
    name:     'Productos del día',
    tagline:  'Listado del catálogo del día',
    pngLayout: 'list',
    build: (ctx) => {
      const items = (ctx.selectedProducts?.length ? ctx.selectedProducts : topProducts(ctx.products))
        .map((p) => `  • ${p.name} — $${p.unitPrice}/${p.unitLabel}`)
        .join('\n')
      const lines = items || '  (Cargá productos para que aparezcan acá)'
      const window = ctx.nextWindow
        ? `\n\n🕐 Próxima recogida: ${formatWindow(ctx.nextWindow)}`
        : ''
      return `🛒 ¡Hoy en ${ctx.businessName ?? 'el negocio'}!\n\n${lines}${window}${URL_LINE(ctx.catalogUrl)}`
    },
  },
  {
    id:       'fresh-arrival',
    icon:     '🆕',
    name:     'Stock fresco entrando',
    tagline:  'Anuncia mercadería recién llegada',
    pngLayout: 'hero-product',
    build: (ctx) => {
      const items = (ctx.selectedProducts?.length ? ctx.selectedProducts : topProducts(ctx.products, 3))
        .map((p) => `  ✓ ${p.name}`)
        .join('\n')
      return `🆕 ¡Stock fresco!\n\nAcaba de entrar:\n\n${items || '  (Seleccioná los productos nuevos)'}\n\nPasá rápido antes que se acabe.${URL_LINE(ctx.catalogUrl)}`
    },
  },
  {
    id:       'offer',
    icon:     '🔥',
    name:     'Oferta especial',
    tagline:  'Producto destacado con precio rebajado',
    pngLayout: 'hero-product',
    build: (ctx) => {
      const first = ctx.selectedProducts?.[0] ?? ctx.products?.find((p) => p.isActive)
      const name  = first?.name ?? 'el producto destacado'
      const price = first ? `$${first.unitPrice}/${first.unitLabel}` : ''
      return `🔥 ¡OFERTA DEL DÍA!\n\n${name}${price ? `\nA solo ${price}` : ''}\n\nTiempo limitado — entrá y reservá tu pedido.${URL_LINE(ctx.catalogUrl)}`
    },
  },
  {
    id:       'low-stock',
    icon:     '⚠️',
    name:     'Últimas unidades',
    tagline:  'Avisar productos con poco stock',
    pngLayout: 'badge',
    build: (ctx) => {
      const low = (ctx.products ?? [])
        .filter((p) => p.isActive && p.inventory && p.inventory.quantityAvailable <= p.inventory.lowStockThreshold)
        .slice(0, 5)
      const items = low.length
        ? low.map((p) => `  ⚠️ ${p.name} — quedan ${p.inventory!.quantityAvailable} ${p.unitLabel}`).join('\n')
        : '  (Sin productos con stock bajo ahora mismo)'
      return `⚠️ ¡ÚLTIMAS UNIDADES!\n\n${items}\n\nNo te quedes sin el tuyo.${URL_LINE(ctx.catalogUrl)}`
    },
  },
  {
    id:       'reminder',
    icon:     '⏰',
    name:     'Recordatorio cierre',
    tagline:  'Recordá a tus clientes el deadline',
    pngLayout: 'notice',
    build: (ctx) => {
      const cutoff = ctx.nextWindow
        ? `cierra hoy antes de las ${ctx.nextWindow.endTime}`
        : 'cierra hoy a las 20:00 hs'
      return `⏰ RECORDATORIO\n\nEl plazo para reservar ${cutoff}.\n\nSi todavía no hiciste tu pedido, entrá ahora antes de que se llene la ventana.${URL_LINE(ctx.catalogUrl)}`
    },
  },
  {
    id:       'window-opening',
    icon:     '🟢',
    name:     'Apertura de ventana',
    tagline:  'Aviso de que se abre una nueva ventana',
    pngLayout: 'notice',
    build: (ctx) => {
      const w = ctx.nextWindow
      const when = w ? formatWindow(w) : 'la próxima ventana'
      return `🟢 ¡Ventana abierta!\n\nYa podés reservar para ${when}.\n\nEl primero que entra elige primero.${URL_LINE(ctx.catalogUrl)}`
    },
  },
  {
    id:       'closed-temp',
    icon:     '🚪',
    name:     'Cierre temporal',
    tagline:  'Avisar de cierre temporal',
    pngLayout: 'notice',
    build: (ctx) => {
      return `🚪 CERRAMOS TEMPORALMENTE\n\nHoy no abrimos por motivos puntuales.\n\nGracias por la paciencia — volvemos pronto a recibir pedidos.\n\nLos avisamos por este canal cuando reabrimos.`
    },
  },
  {
    id:       'thank-you',
    icon:     '🙏',
    name:     'Agradecimiento',
    tagline:  'Mensaje de gratitud al canal',
    pngLayout: 'notice',
    build: (ctx) => {
      return `🙏 GRACIAS\n\nGracias a todos los que pasaron por ${ctx.businessName ?? 'el negocio'} esta semana.\n\nSu apoyo nos mantiene andando. Si te gustó tu pedido, contale a alguien más.\n\nNos vemos en la próxima.${URL_LINE(ctx.catalogUrl)}`
    },
  },
]

function formatWindow(w: NonNullable<TemplateContext['nextWindow']>): string {
  const d = new Date(w.date + 'T12:00:00')
  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const dd       = new Date(d);     dd.setHours(0, 0, 0, 0)

  let label = ''
  if (dd.getTime() === today.getTime())    label = 'hoy'
  else if (dd.getTime() === tomorrow.getTime()) label = 'mañana'
  else label = d.toLocaleDateString('es-CU', { weekday: 'long', day: 'numeric', month: 'short' })

  return `${label} ${w.startTime}–${w.endTime}`
}
