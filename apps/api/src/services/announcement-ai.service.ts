/**
 * Generación de anuncios con Anthropic Claude.
 *
 * Si ANTHROPIC_API_KEY no está configurado, el endpoint devuelve 503 con un
 * mensaje claro para que el operador active la feature.
 */

import { env } from '@colacero/env'

export interface ProductForAi {
  name:      string
  price:     number
  unit:      string
  stock?:    number
}

export interface PickupWindowForAi {
  date:      string  // YYYY-MM-DD
  startTime: string
  endTime:   string
}

export interface GenerateInput {
  businessName:   string
  type:           'offer' | 'fresh' | 'reminder' | 'thank-you' | 'daily' | 'custom'
  tone:           'casual' | 'formal' | 'friendly'
  products?:      ProductForAi[]
  pickupWindow?:  PickupWindowForAi | null
  catalogUrl?:    string
  customPrompt?:  string
}

export interface GenerateOutput {
  variants: string[]
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super('ai_not_configured')
  }
}

const TYPE_DESCRIPTIONS = {
  offer:      'oferta especial / producto destacado a precio rebajado',
  fresh:      'mercadería fresca recién entrada al inventario',
  reminder:   'recordatorio de que el plazo para reservar cierra pronto',
  'thank-you': 'mensaje de agradecimiento a los clientes del canal',
  daily:      'anuncio de los productos disponibles hoy',
  custom:     'mensaje personalizado según las instrucciones del operador',
} as const

const TONE_DESCRIPTIONS = {
  casual:   'cubano, cercano, cálido, como hablándole a un vecino',
  formal:   'profesional pero amable, sin sonar acartonado',
  friendly: 'entre amigos, divertido pero respetuoso',
} as const

function buildPrompt(input: GenerateInput): string {
  const lines: string[] = []

  lines.push(`Soy copywriter de un pequeño negocio cubano llamado "${input.businessName}".`)
  lines.push(`Necesito 3 variantes de un anuncio para mandar al canal de Telegram del negocio.`)
  lines.push('')
  lines.push(`Tipo de anuncio: ${TYPE_DESCRIPTIONS[input.type]}`)
  lines.push(`Tono: ${TONE_DESCRIPTIONS[input.tone]}`)
  lines.push('')

  if (input.products && input.products.length > 0) {
    lines.push('Productos disponibles a destacar:')
    for (const p of input.products) {
      const stockNote = p.stock != null && p.stock < 10 ? ` (¡quedan solo ${p.stock}!)` : ''
      lines.push(`  - ${p.name}: $${p.price}/${p.unit}${stockNote}`)
    }
    lines.push('')
  }

  if (input.pickupWindow) {
    lines.push(`Próxima ventana de recogida: ${input.pickupWindow.date} de ${input.pickupWindow.startTime} a ${input.pickupWindow.endTime}`)
    lines.push('')
  }

  if (input.catalogUrl) {
    lines.push(`Catálogo: ${input.catalogUrl}`)
    lines.push('')
  }

  if (input.type === 'custom' && input.customPrompt) {
    lines.push(`Instrucciones del operador: ${input.customPrompt}`)
    lines.push('')
  }

  lines.push('REGLAS:')
  lines.push('- Cada variante MAX 280 caracteres (importante para Telegram)')
  lines.push('- Usá español cubano natural, no neutro')
  lines.push('- Máximo 4 emojis por mensaje, con criterio (no de adorno)')
  lines.push('- Termina con call-to-action claro (ej: "entrá ahora", "reservá ya")')
  lines.push('- Si hay catálogo, incluí el link al final')
  lines.push('- Sin caracteres especiales que se vean raros en Telegram')
  lines.push('- Las 3 variantes deben tener ángulos distintos (no decir lo mismo con otras palabras)')
  lines.push('')
  lines.push('Devolveme SOLO un JSON válido con esta forma exacta:')
  lines.push('{ "variants": ["variante 1", "variante 2", "variante 3"] }')
  lines.push('Sin markdown, sin explicaciones extra, solo el JSON.')

  return lines.join('\n')
}

export async function generateAnnouncementVariants(input: GenerateInput): Promise<GenerateOutput> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new AiNotConfiguredError()
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk')
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const prompt = buildPrompt(input)

  const msg = await client.messages.create({
    model:      env.ANTHROPIC_MODEL,
    max_tokens: 1024,
    messages: [
      { role: 'user', content: prompt },
    ],
  })

  // Extraer el texto del response
  const block = msg.content.find((b) => b.type === 'text')
  if (!block || block.type !== 'text') {
    throw new Error('ai_empty_response')
  }

  const raw = block.text.trim()
  // Quitar wrappers de markdown si los hubiera
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  let parsed: { variants?: unknown }
  try {
    parsed = JSON.parse(cleaned) as { variants?: unknown }
  } catch {
    throw new Error('ai_invalid_json_response')
  }

  if (!Array.isArray(parsed.variants) || parsed.variants.length === 0) {
    throw new Error('ai_no_variants_returned')
  }

  const variants = parsed.variants
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
    .slice(0, 5)  // safety

  if (variants.length === 0) throw new Error('ai_no_valid_variants')

  return { variants }
}
