'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import type { CatalogProduct } from '../lib/api'
import { getProductFallbackImage } from '../lib/product-images'
import { AddToCartButton } from './add-to-cart-button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name' | 'in-stock'

const SORT_LABELS: Record<SortOption, string> = {
  'default':    'Recomendado',
  'price-asc':  'Precio ↑',
  'price-desc': 'Precio ↓',
  'name':       'Nombre A-Z',
  'in-stock':   'Con stock primero',
}

function useDebounce(value: string, delay = 200): string {
  const [debounced, setDebounced] = useState(value)
  useMemo(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

function StockLabel({ inventory }: { inventory: CatalogProduct['inventory'] }) {
  if (inventory == null) return null
  const { quantityAvailable, lowStockThreshold } = inventory
  if (quantityAvailable === 0) return <Badge variant="destructive">Sin stock</Badge>
  if (quantityAvailable <= lowStockThreshold) return <Badge variant="warning">Últimas {quantityAvailable}</Badge>
  return <Badge variant="success">Disponible</Badge>
}

function ProductRow({ product }: { product: CatalogProduct }) {
  const outOfStock = product.inventory?.quantityAvailable === 0
  const imageSrc   = product.imageUrl ?? getProductFallbackImage(product.name)

  return (
    <article
      className={`glass flex gap-3 rounded-2xl p-3 transition-all ${outOfStock ? 'opacity-50' : ''}`}
    >
      <div
        className="relative h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        {imageSrc != null ? (
          <Image src={imageSrc} alt={product.name} fill sizes="88px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">📦</div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div>
          <h2 className="font-semibold text-sm leading-snug" style={{ color: 'var(--text)' }}>
            {product.name}
          </h2>
          {product.description != null && (
            <p className="mt-0.5 text-xs line-clamp-1" style={{ color: 'var(--muted)' }}>
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-base font-mono font-bold text-gradient">
              ${Number(product.unitPrice).toFixed(2)}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
              por {product.unitLabel}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StockLabel inventory={product.inventory ?? null} />
            <AddToCartButton product={product} disabled={outOfStock} />
          </div>
        </div>
      </div>
    </article>
  )
}

interface Props {
  products: CatalogProduct[]
}

export function CatalogView({ products }: Props) {
  const [search, setSearch]               = useState('')
  const [selectedCategory, setCategory]   = useState<string | null>(null)
  const [sortBy, setSortBy]               = useState<SortOption>('default')
  const [sortOpen, setSortOpen]           = useState(false)
  const debouncedSearch                   = useDebounce(search)

  // Categorías únicas, ordenadas
  const categories = useMemo(() => {
    const cats = products
      .map((p) => p.category)
      .filter((c): c is string => typeof c === 'string' && c.trim() !== '')
    return [...new Set(cats)].sort()
  }, [products])

  const filtered = useMemo(() => {
    let result = products

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q),
      )
    }

    if (selectedCategory != null) {
      result = result.filter((p) => p.category === selectedCategory)
    }

    switch (sortBy) {
      case 'price-asc':
        result = [...result].sort((a, b) => Number(a.unitPrice) - Number(b.unitPrice))
        break
      case 'price-desc':
        result = [...result].sort((a, b) => Number(b.unitPrice) - Number(a.unitPrice))
        break
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'es'))
        break
      case 'in-stock':
        result = [...result].sort((a, b) => {
          const aStock = a.inventory?.quantityAvailable ?? 0
          const bStock = b.inventory?.quantityAvailable ?? 0
          return bStock - aStock
        })
        break
    }

    return result
  }, [products, debouncedSearch, selectedCategory, sortBy])

  return (
    <div className="flex flex-col gap-3">
      {/* Barra de búsqueda */}
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
          style={{ color: 'var(--muted)' }}
        >
          🔍
        </span>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar productos…"
          className="pl-9"
        />
      </div>

      {/* Pills de categoría + Ordenar */}
      {(categories.length > 0) && (
        <div className="flex items-center gap-2">
          {/* Pills scroll-x */}
          <div className="flex flex-1 gap-2 overflow-x-auto pb-1 min-w-0 scrollbar-none">
            <button
              onClick={() => setCategory(null)}
              className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              style={
                selectedCategory === null
                  ? { backgroundColor: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid var(--border-glow)' }
                  : { backgroundColor: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
              }
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat === selectedCategory ? null : cat)}
                className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors"
                style={
                  selectedCategory === cat
                    ? { backgroundColor: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid var(--border-glow)' }
                    : { backgroundColor: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }
                }
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Ordenar dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setSortOpen((v) => !v)}
              className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
            >
              ⇅ {sortBy !== 'default' ? SORT_LABELS[sortBy] : 'Ordenar'}
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <ul
                  className="absolute right-0 top-8 z-20 glass rounded-xl shadow-xl py-1 min-w-[160px]"
                  style={{ border: '1px solid var(--glass-border)' }}
                >
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                    <li key={opt}>
                      <button
                        onClick={() => { setSortBy(opt); setSortOpen(false) }}
                        className="w-full text-left px-4 py-2 text-sm transition-colors hover:opacity-80"
                        style={{
                          color: sortBy === opt ? 'var(--primary)' : 'var(--text)',
                          fontWeight: sortBy === opt ? 600 : 400,
                        }}
                      >
                        {SORT_LABELS[opt]}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* Conteo y lista */}
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
        {filtered.length}{' '}
        {filtered.length === 1 ? 'producto' : 'productos'}
        {selectedCategory != null && ` en "${selectedCategory}"`}
        {debouncedSearch.trim() && ` para "${debouncedSearch.trim()}"`}
      </p>

      {filtered.length === 0 ? (
        <p className="py-12 text-center" style={{ color: 'var(--muted)' }}>
          Sin resultados. Probá con otro término.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((product) => (
            <ProductRow key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}
