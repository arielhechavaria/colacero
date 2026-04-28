import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getCatalog, type CatalogProduct } from '../../lib/api'
import { AddToCartButton } from '../../components/add-to-cart-button'

export const revalidate = 60 // ISR — revalida cada 60s

interface Props {
  params: { slug: string }
}

function StockLabel({ inventory }: { inventory: CatalogProduct['inventory'] }) {
  if (inventory == null) return null

  const { quantityAvailable, lowStockThreshold } = inventory

  if (quantityAvailable === 0) {
    return <span className="text-sm font-medium text-red-500">Sin stock</span>
  }
  if (quantityAvailable <= lowStockThreshold) {
    return (
      <span className="text-sm font-medium text-amber-500">
        Últimas {quantityAvailable}
      </span>
    )
  }
  return (
    <span className="text-sm font-medium text-emerald-600">
      {quantityAvailable} disponibles
    </span>
  )
}

function ProductRow({ product }: { product: CatalogProduct }) {
  const outOfStock = product.inventory?.quantityAvailable === 0

  return (
    <article
      className={`flex gap-4 rounded-2xl bg-white p-4 shadow-sm${
        outOfStock ? ' opacity-60' : ''
      }`}
    >
      {/* Imagen */}
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {product.imageUrl != null ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">
            📦
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h2 className="font-semibold leading-snug text-gray-900">
            {product.name}
          </h2>
          {product.description != null && (
            <p className="mt-0.5 text-xs text-gray-400 line-clamp-1">
              {product.description}
            </p>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-lg font-bold text-teal-700">
              ${Number(product.unitPrice).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">por {product.unitLabel}</p>
          </div>
          <StockLabel inventory={product.inventory ?? null} />
        </div>
      </div>
    </article>
  )
}

export default async function CatalogPage({ params }: Props) {
  const data = await getCatalog(params.slug)
  if (data == null) notFound()

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header con color de marca */}
      <header className="bg-teal-700 px-4 pb-6 pt-8 text-white">
        <p className="mb-1 text-sm font-medium text-teal-200">Catálogo online</p>
        <h1 className="text-2xl font-bold">{data.business.name}</h1>
        {data.business.description != null && (
          <p className="mt-1 text-sm text-teal-100">{data.business.description}</p>
        )}
      </header>

      {/* Lista de productos */}
      <div className="mx-auto max-w-lg px-4 py-6">
        {data.products.length === 0 ? (
          <p className="py-16 text-center text-gray-400">
            Este negocio aún no tiene productos publicados.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
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
