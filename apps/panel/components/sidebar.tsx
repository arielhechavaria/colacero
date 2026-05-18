'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from './logo'
import { ThemeToggle } from './theme-toggle'
import { getMe, isAuthenticatedClient } from '../lib/api'

const NAV_ITEMS = [
  { href: '/orders',        icon: '📋', label: 'Pedidos' },
  { href: '/queue',         icon: '🍳', label: 'Cola de prep.' },
  { href: '/windows',       icon: '🕐', label: 'Ventanas' },
  { href: '/announcements', icon: '📣', label: 'Anuncios' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!isAuthenticatedClient()) return
    void getMe('').then((u) => setIsAdmin(u.role === 'SUPER_ADMIN')).catch(() => { /* noop */ })
  }, [pathname])

  // Don't render sidebar on login page or forgot/reset
  if (pathname === '/login' || pathname === '/forgot-password' || pathname?.startsWith('/reset-password')) return null

  return (
    <aside
      className="fixed left-0 top-0 z-20 flex h-full w-[220px] flex-col"
      style={{ backgroundColor: 'var(--sidebar)' }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center px-5 border-b border-white/10">
        <Logo size="sm" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium
                transition-all
                ${isActive
                  ? 'bg-[var(--primary-dim)] border border-[var(--border-glow)] text-[var(--primary)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-[var(--font-body)]">{item.label}</span>
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-3 mt-3 border-t border-white/10" />
            <Link
              href="/admin/businesses"
              className={`
                flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all
                ${pathname?.startsWith('/admin')
                  ? 'bg-[var(--primary-dim)] border border-[var(--border-glow)] text-[var(--primary)]'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }
              `}
            >
              <span className="text-base">👑</span>
              <span className="font-[var(--font-body)]">Admin</span>
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">
        <span className="text-xs text-white/30">ColaCero</span>
        <ThemeToggle />
      </div>
    </aside>
  )
}
