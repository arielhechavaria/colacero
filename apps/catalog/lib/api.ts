const BASE = process.env['CATALOG_API_URL'] ?? 'http://localhost:3000'

export interface CatalogProduct {
  id: string
  name: string
  description?: string | null
  unitPrice: string // Prisma Decimal → string en JSON
  unitLabel: string
  imageUrl?: string | null
  category?: string | null
  isActive: boolean
  inventory?: {
    quantityAvailable: number
    lowStockThreshold: number
  } | null
}

export interface NextPickupWindow {
  id:        string
  date:      string   // YYYY-MM-DD
  startTime: string
  endTime:   string
  spotsLeft: number
  capacity:  number
}

export interface CatalogData {
  business: {
    id: string
    name: string
    slug: string
    description?: string | null
    timezone?: string
    address?:   string | null
    latitude?:  number | null
    longitude?: number | null
  }
  nextPickupWindow: NextPickupWindow | null
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
