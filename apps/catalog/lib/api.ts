const BASE = process.env['CATALOG_API_URL'] ?? 'http://localhost:3000'

export interface CatalogProduct {
  id: string
  name: string
  description?: string | null
  unitPrice: string // Prisma Decimal → string en JSON
  unitLabel: string
  imageUrl?: string | null
  isActive: boolean
  inventory?: {
    quantityAvailable: number
    lowStockThreshold: number
  } | null
}

export interface CatalogData {
  business: {
    id: string
    name: string
    slug: string
  }
  products: CatalogProduct[]
}

export async function getCatalog(slug: string): Promise<CatalogData | null> {
  const res = await fetch(`${BASE}/api/catalog/${slug}`, {
    next: { revalidate: 60 },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`catalog fetch failed: ${res.status}`)
  return res.json() as Promise<CatalogData>
}
