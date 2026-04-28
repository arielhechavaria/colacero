import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getCatalog, type CatalogProduct } from '../../lib/api'

export const revalidate = 60 // ISR — revalida cada 60s

interface Props {
  params: { slug: string }
}

function ProductCard({ product }: { product: CatalogProduct }) {
  const outOfStock = product.inventory?.quantityAvailable === 0
  const lowStock =
    !outOfStock &&
    product.inventory != null &&
    product.inventory.quantityAvailable <= product.inventory.lowStockThreshold

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm">
      {/* Imagen */}
      <div className="relative aspect-square w-full bg-gray-100">
        {product.imageUrl != null ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-gray-300">
            📦
          </div>
        )}

        {/* Badges de stock */}
        {outOfStock && (
          <span className="absolute right-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
            Sin stock
          </span>
        )}
        {lowStock && (
          <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-white">
            Últimas unidades
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h2 className="line-clamp-2 text-sm font-semibold leading-snug">
          {product.name}
        </h2>
        {product.description != null && (
          <p className="line-clamp-2 text-xs text-gray-500">
            {product.description}
          </p>
        )}
        <p className="mt-auto pt-2 text-base font-bold text-emerald-600">
          ${Number(product.unitPrice).toFixed(2)}{' '}
          <span className="text-xs font-normal text-gray-400">
            / {product.unitLabel}
          </span>
        </p>
      </div>
    </article>
  )
}

export default async function CatalogPage({ params }: Props) {
  const data = await getCatalog(params.slug)
  if (data == null) notFound()

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold">{data.business.name}</h1>
        <p className="mt-1 text-sm text-gray-500">Catálogo online</p>
      </header>

      {/* Grid de productos */}
      {data.products.length === 0 ? (
        <p className="text-center text-gray-400">
          Este negocio aún no tiene productos publicados.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  )
}
