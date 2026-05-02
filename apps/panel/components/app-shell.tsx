'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Logo } from './logo'
import { ThemeToggle } from './theme-toggle'

const NAV_ITEMS = [
  { href: '/orders',        icon: '📋', label: 'Pedidos'       },
  { href: '/queue',         icon: '🍳', label: 'Cola de prep.' },
  { href: '/windows',       icon: '🕐', label: 'Ventanas'      },
  { href: '/announcements', icon: '📣', label: 'Anuncios'      },
]

const SIDEBAR_W_EXPANDED  = 220
const SIDEBAR_W_COLLAPSED = 64

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const isLogin    = pathname === '/login'

  const [collapsed, setCollapsed] = useState(false)
  const [mounted,   setMounted]   = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem('sidebar-collapsed')
      if (stored !== null) setCollapsed(stored === 'true')
    } catch { /* SSR / private browsing */ }
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch { /* */ }
      return next
    })
  }, [])

  const sidebarW = collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W_EXPANDED

  // Login page: no sidebar, full-screen layout
  if (isLogin) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      <aside
        className="fixed left-0 top-0 z-20 flex h-full flex-col overflow-hidden"
        style={{
          width:           sidebarW,
          backgroundColor: 'var(--sidebar)',
          transition:      'width 200ms ease',
        }}
      >
        {/* Header: logo + toggle */}
        <div
          className="flex h-16 flex-shrink-0 items-center border-b border-white/10"
          style={{ justifyContent: collapsed ? 'center' : 'space-between', padding: collapsed ? '0' : '0 12px 0 20px' }}
        >
          {!collapsed && <Logo size="sm" variant="sidebar" />}
          <button
            onClick={toggle}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-sm text-white/50 hover:bg-white/10 hover:text-white/80 transition-all"
          >
            {collapsed ? '▶' : '◀'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3" style={{ padding: collapsed ? '12px 8px' : '12px 12px' }}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className="mb-1 flex items-center rounded-xl py-2.5 text-sm font-medium transition-all"
                style={{
                  gap:             collapsed ? 0 : 12,
                  padding:         collapsed ? '10px 0' : '10px 12px',
                  justifyContent:  collapsed ? 'center' : 'flex-start',
                  backgroundColor: isActive ? 'var(--primary-dim)' : 'transparent',
                  border:          isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
                  color:           isActive ? 'var(--primary)' : 'rgba(255,255,255,0.5)',
                }}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span style={{ fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="flex flex-shrink-0 items-center border-t border-white/10 py-4"
          style={{
            justifyContent: collapsed ? 'center' : 'space-between',
            padding:        collapsed ? '16px 0' : '16px 20px',
          }}
        >
          {!collapsed && (
            <span className="text-xs text-white/30">ColaCero</span>
          )}
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main
        className="flex-1 min-h-screen"
        style={{
          marginLeft: mounted ? sidebarW : SIDEBAR_W_EXPANDED,
          transition: 'margin-left 200ms ease',
        }}
      >
        {children}
      </main>
    </div>
  )
}
