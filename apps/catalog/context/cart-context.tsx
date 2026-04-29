'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useCart, type CartItem } from '../hooks/use-cart'

interface CartContextValue {
  items: CartItem[]
  total: number
  itemCount: number
  add:    (item: Omit<CartItem, 'quantity'>) => void
  remove: (productId: string) => void
  clear:  () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useCart()
  return <CartContext.Provider value={cart}>{children}</CartContext.Provider>
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext)
  if (ctx === null) {
    throw new Error('useCartContext must be used inside CartProvider')
  }
  return ctx
}
