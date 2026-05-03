import type { ReactNode } from 'react'
import { CartProvider }        from '../../context/cart-context'
import { CartDrawer }          from '../../components/cart-drawer'
import { TelegramAuthInit }    from '../../components/telegram-auth-init'

export default function SlugLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <TelegramAuthInit />
      {children}
      <CartDrawer />
    </CartProvider>
  )
}
