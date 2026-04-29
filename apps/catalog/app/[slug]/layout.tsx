import type { ReactNode } from 'react'
import { CartProvider } from '../../context/cart-context'
import { CartDrawer } from '../../components/cart-drawer'

export default function SlugLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      {children}
      <CartDrawer />
    </CartProvider>
  )
}
