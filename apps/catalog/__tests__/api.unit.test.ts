import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCatalog, type CatalogData } from '../lib/api'

const mockCatalog: CatalogData = {
  business: { id: 'biz-1', name: 'El Fogón', slug: 'el-fogon' },
  products: [
    {
      id: 'prod-1',
      name: 'Empanada',
      unitPrice: '150.00',
      unitLabel: 'unidad',
      isActive: true,
      inventory: { quantityAvailable: 10, lowStockThreshold: 3 },
    },
  ],
}

describe('getCatalog', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('ok: fetch 200 → devuelve CatalogData', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve(mockCatalog),
    }))

    const result = await getCatalog('el-fogon')
    expect(result).toEqual(mockCatalog)
  })

  it('not-found: fetch 404 → devuelve null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
      json: () => Promise.resolve({ error: 'not_found' }),
    }))

    const result = await getCatalog('no-existe')
    expect(result).toBeNull()
  })

  it('error: fetch 500 → lanza Error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
    }))

    await expect(getCatalog('el-fogon')).rejects.toThrow('catalog fetch failed: 500')
  })

  it('url: llama a la URL correcta', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: () => Promise.resolve(mockCatalog),
    })
    vi.stubGlobal('fetch', mockFetch)

    await getCatalog('mi-negocio')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/catalog/mi-negocio'),
      expect.any(Object),
    )
  })
})
