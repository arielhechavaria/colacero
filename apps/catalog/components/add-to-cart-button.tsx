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
            name:      product.name,
            unitPrice: product.unitPrice,
            unitLabel: product.unitLabel,
          })
        }
        disabled={disabled}
        className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold shadow disabled:opacity-40"
        style={{ backgroundColor: 'var(--primary)', color: 'white' }}
        aria-label={`Agregar ${product.name} al carrito`}
      >
        +
      </button>
    )
  }

  return (
    <div
      className="flex items-center gap-2 rounded-full border px-2 py-1"
      style={{
        backgroundColor: 'var(--primary-dim)',
        borderColor: 'var(--border-glow)',
      }}
    >
      <button
        onClick={() => remove(product.id)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold"
        style={{ color: 'var(--primary)' }}
        aria-label="Quitar uno"
      >
        −
      </button>
      <span
        className="w-4 text-center text-sm font-semibold"
        style={{ color: 'var(--primary)' }}
      >
        {quantity}
      </span>
      <button
        onClick={() =>
          add({
            productId: product.id,
            name:      product.name,
            unitPrice: product.unitPrice,
            unitLabel: product.unitLabel,
          })
        }
        disabled={disabled}
        className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold disabled:opacity-40"
        style={{ color: 'var(--primary)' }}
        aria-label="Agregar uno más"
      >
        +
      </button>
    </div>
  )
}
