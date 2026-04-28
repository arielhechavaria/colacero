'use client'

import { useCartContext } from '../context/cart-context'
import type { CatalogProduct } from '../lib/api'

interface Props {
  product: Pick<CatalogProduct, 'id' | 'name' | 'unitPrice' | 'unitLabel'>
  disabled?: boolean
}

export function AddToCartButton({ product, disabled = false }: Props) {
  const { items, add, remove } = useCartContext()
  const cartItem = items.find((i) => i.productId === product.id)
  const quantity = cartItem?.quantity ?? 0

  if (quantity === 0) {
    return (
      <button
        onClick={() =>
          add({
            productId: product.id,
            name:       product.name,
            unitPrice:  product.unitPrice,
            unitLabel:  product.unitLabel,
          })
        }
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-700 text-xl font-bold text-white shadow disabled:opacity-40"
        aria-label={`Agregar ${product.name} al carrito`}
      >
        +
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => remove(product.id)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-700"
        aria-label="Quitar uno"
      >
        −
      </button>
      <span className="w-4 text-center text-sm font-semibold">{quantity}</span>
      <button
        onClick={() =>
          add({
            productId: product.id,
            name:       product.name,
            unitPrice:  product.unitPrice,
            unitLabel:  product.unitLabel,
          })
        }
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-700 text-lg font-bold text-white disabled:opacity-40"
        aria-label="Agregar uno más"
      >
        +
      </button>
    </div>
  )
}
