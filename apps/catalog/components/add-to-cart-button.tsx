'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCartContext } from '../context/cart-context'
import type { CatalogProduct } from '../lib/api'

interface Props {
  product: Pick<CatalogProduct, 'id' | 'name' | 'unitPrice' | 'unitLabel'>
  disabled?: boolean
}

export function AddToCartButton({ product, disabled = false }: Props) {
  const { items, add, remove } = useCartContext()
  const cartItem  = items.find((i) => i.productId === product.id)
  const quantity  = cartItem?.quantity ?? 0
  const [flash, setFlash] = useState(false)

  function handleAdd() {
    add({
      productId: product.id,
      name:      product.name,
      unitPrice: product.unitPrice,
      unitLabel: product.unitLabel,
    })
    setFlash(true)
    setTimeout(() => setFlash(false), 650)
  }

  if (quantity === 0) {
    return (
      <motion.button
        onClick={handleAdd}
        disabled={disabled}
        whileTap={{ scale: 0.88 }}
        className="flex h-9 w-9 items-center justify-center rounded-full text-xl font-bold shadow-sm disabled:opacity-40 overflow-hidden transition-colors duration-200"
        style={{
          backgroundColor: flash ? 'var(--success)' : 'var(--primary)',
          color: 'white',
        }}
        aria-label={`Agregar ${product.name} al carrito`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {flash ? (
            <motion.span
              key="check"
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 300 }}
            >
              ✓
            </motion.span>
          ) : (
            <motion.span
              key="plus"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', damping: 14, stiffness: 300 }}
            >
              +
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    )
  }

  return (
    <div
      className="flex items-center gap-2 rounded-full border px-2 py-1"
      style={{ backgroundColor: 'var(--primary-dim)', borderColor: 'var(--border-glow)' }}
    >
      <motion.button
        onClick={() => remove(product.id)}
        whileTap={{ scale: 0.85 }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold"
        style={{ color: 'var(--primary)' }}
        aria-label="Quitar uno"
      >
        −
      </motion.button>

      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={quantity}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.6, opacity: 0 }}
          transition={{ type: 'spring', damping: 14, stiffness: 300 }}
          className="w-4 text-center text-sm font-semibold"
          style={{ color: 'var(--primary)' }}
        >
          {quantity}
        </motion.span>
      </AnimatePresence>

      <motion.button
        onClick={handleAdd}
        disabled={disabled}
        whileTap={{ scale: 0.85 }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-lg font-bold disabled:opacity-40"
        style={{ color: 'var(--primary)' }}
        aria-label="Agregar uno más"
      >
        +
      </motion.button>
    </div>
  )
}
