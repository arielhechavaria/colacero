import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getCatalog, type CatalogProduct } from '../../lib/api'
import { AddToCartButton } from '../../components/add-to-cart-button'
import { Logo } from '../../components/logo'
import { ThemeToggle } from '../../components/theme-toggle'

export const revalidate = 60 // ISR — revalida cada 60s

interface Props {
  params: Promise<{ slug: string }>
}

function StockLabel({ inventory }: { inventory: CatalogProduct['inventory'] }) {
  if (inventory == null) return null

  const { quantityAvailable, lowStockThreshold } = inventory

  if (quantityAvailable === 0) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: 'rgba(255,61,85,0.1)', color: 'var(--error)' }}
      >
        Sin stock
      </span>
    )
  }
  if (quantityAvailable <= lowStockThreshold) {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
        style={{ backgroundColor: 'rgba(255,176,32,0.12)', color: 'var(--warning)' }}
      >
        Últimas {quantityAvailable}
      </span>
    )
  }
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: 'rgba(0,214,143,0.12)', color: 'var(--success)' }}
    >
      Disponible
    </span>
  )
}

function ProductRow({ product }: { product: CatalogProduct }) {
  const outOfStock = product.inventory?.quantityAvailable === 0

  return (
    <article
      className={`glass flex gap-3 rounded-2xl p-3 transition-all ${outOfStock ? 'opacity-50' : ''}`}
    >
      {/* Imagen */}
      <div
        className="relative h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--surface)' }}
      >
        {product.imageUrl != null ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="88px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">
            📦
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between py-0.5">
        <div>
          <h2
            className="font-semibold text-sm leading-snug"
            style={{ color: 'var(--text)' }}
          >
            {product.name}
          </h2>
          {product.description != null && (
            <p
              className="mt-0.5 text-xs line-clamp-1"
              style={{ color: 'var(--muted)' }}
            >
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

export default async function CatalogPage({ params }: Props) {
  const { slug } = await params
  const data = await getCatalog(slug)
  if (data == null) notFound()

  return (
    <main className="min-h-screen">
      {/* Header glass */}
      <header
        className="sticky top-0 z-10 glass px-4 py-3"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <Logo size="sm" className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1
              className="text-sm font-bold leading-tight truncate"
              style={{ color: 'var(--text)' }}
            >
              {data.business.name}
            </h1>
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mt-0.5"
              style={{
                backgroundColor: 'var(--primary-dim)',
                color:           'var(--primary)',
                border:          '1px solid var(--border-glow)',
              }}
            >
              recogé sin cola
            </span>
          </div>
          <ThemeToggle className="flex-shrink-0" />
        </div>
      </header>

      {/* Lista de productos — pb extra para el FAB */}
      <div className="mx-auto max-w-lg px-4 py-4" style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}>
        {data.products.length === 0 ? (
          <p className="py-16 text-center" style={{ color: 'var(--muted)' }}>
            Este negocio aún no tiene productos publicados.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--muted)' }}
            >
              {data.products.length}{' '}
              {data.products.length === 1 ? 'producto disponible' : 'productos disponibles'}
            </p>
            {data.products.map((product) => (
              <ProductRow key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
