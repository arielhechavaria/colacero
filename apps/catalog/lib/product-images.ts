/**
 * Fallback images for products without an imageUrl.
 * Maps Spanish product keywords → curated Unsplash photo IDs.
 * Usage: getProductFallbackImage(product.name) → URL | null
 */

const BASE   = 'https://images.unsplash.com'
const SUFFIX = '?w=200&h=200&fit=crop&auto=format&q=80'

function unsplash(id: string): string {
  return `${BASE}/${id}${SUFFIX}`
}

/**
 * Keyword → Unsplash photo ID.
 * Order matters: more specific keywords first (e.g. "pollo" before "carne").
 */
const KEYWORDS: [string, string][] = [
  // ── Carnes ───────────────────────────────────────────────────────────────
  ['pollo',       'photo-1604503468506-a8da13d82791'],
  ['cerdo',       'photo-1432139509613-5c4255815697'],
  ['puerco',      'photo-1432139509613-5c4255815697'],
  ['res',         'photo-1551028719-00167b16eac5'],
  ['bistec',      'photo-1551028719-00167b16eac5'],
  ['carne',       'photo-1551028719-00167b16eac5'],
  ['pescado',     'photo-1534482421-64566f976cfa'],
  ['salmon',      'photo-1534482421-64566f976cfa'],
  ['atun',        'photo-1534482421-64566f976cfa'],

  // ── Granos y cereales ────────────────────────────────────────────────────
  ['arroz',       'photo-1536304993881-ff86e0c9ef30'],
  ['frijol',      'photo-1551462147-ff29053bfc14'],
  ['lenteja',     'photo-1515543904379-3d757afe72e4'],
  ['garbanzo',    'photo-1515543904379-3d757afe72e4'],
  ['espagueti',   'photo-1555949258-eb67b1ef0ceb'],
  ['pasta',       'photo-1555949258-eb67b1ef0ceb'],
  ['macarron',    'photo-1555949258-eb67b1ef0ceb'],
  ['harina',      'photo-1574323347407-f5e1ad6d020b'],

  // ── Lácteos y derivados ──────────────────────────────────────────────────
  ['leche',       'photo-1563636619-e9143da7973b'],
  ['queso',       'photo-1486297678162-eb2a19b0a32d'],
  ['mantequilla', 'photo-1589985270826-4b7bb135bc9d'],
  ['huevo',       'photo-1587486913049-53fc88980cfc'],
  ['yogur',       'photo-1488477181946-6428a0291777'],

  // ── Pan y repostería ─────────────────────────────────────────────────────
  ['pan',         'photo-1509440159596-0249088772ff'],
  ['galleta',     'photo-1499636136210-6f4ee915583e'],
  ['bizcocho',    'photo-1499636136210-6f4ee915583e'],

  // ── Vegetales ────────────────────────────────────────────────────────────
  ['tomate',      'photo-1546470427-e26264be0b0d'],
  ['cebolla',     'photo-1508747703725-719777637510'],
  ['ajo',         'photo-1540420828642-fca2c5c18abe'],
  ['pimiento',    'photo-1518977822534-7049a61ee0c2'],
  ['zanahoria',   'photo-1447175008436-054170c2e979'],
  ['papa',        'photo-1518977676405-d7f6aa5e30e2'],
  ['patata',      'photo-1518977676405-d7f6aa5e30e2'],
  ['lechuga',     'photo-1622206151226-18ca2c9ab4a1'],
  ['pepino',      'photo-1604977042946-1eecc30f269e'],
  ['berenjena',   'photo-1615484477778-ca3b77940c25'],

  // ── Frutas ───────────────────────────────────────────────────────────────
  ['platano',     'photo-1571771894821-ce9b6c11b08e'],
  ['mango',       'photo-1591073113125-e46713c829ed'],
  ['naranja',     'photo-1580052614034-c55d20bfee3b'],
  ['mandarina',   'photo-1580052614034-c55d20bfee3b'],
  ['limon',       'photo-1575113533813-fb82562a1614'],
  ['aguacate',    'photo-1601039641847-7857b994d704'],
  ['guayaba',     'photo-1491553895911-0055eca6402d'],
  ['papaya',      'photo-1617112848923-cc2234396a8d'],
  ['manzana',     'photo-1560806887-1e4cd0b6cbd6'],
  ['pina',        'photo-1490885578174-acda8905c2c6'],

  // ── Almacén ──────────────────────────────────────────────────────────────
  ['aceite',      'photo-1474979266404-7eaacbcd87c5'],
  ['azucar',      'photo-1558618666-fcd25c85cd64'],
  ['sal',         'photo-1518684079-3c830dcef090'],
  ['vinagre',     'photo-1474979266404-7eaacbcd87c5'],
  ['cafe',        'photo-1495474472287-4d71bcdd2085'],
  ['te',          'photo-1544787219-7f47ccb76574'],
  ['detergente',  'photo-1558618047-3c8c76ca7d13'],
  ['jabon',       'photo-1558618047-3c8c76ca7d13'],
]

/** Remove diacritics and lowercase — handles Spanish accents and ñ. */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Returns a real food photo URL from Unsplash based on keywords found
 * in the product name, or `null` if no keyword matches.
 */
export function getProductFallbackImage(productName: string): string | null {
  const text = normalize(productName)
  for (const [keyword, photoId] of KEYWORDS) {
    if (text.includes(keyword)) return unsplash(photoId)
  }
  return null
}
