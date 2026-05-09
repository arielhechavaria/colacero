'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ThemeToggle } from './theme-toggle'

const NAV_ITEMS = [
  { href: '/dashboard',     icon: '📊', label: 'Dashboard'     },
  { href: '/orders',        icon: '📋', label: 'Pedidos'       },
  { href: '/queue',         icon: '🍳', label: 'Cola de prep.' },
  { href: '/windows',       icon: '🕐', label: 'Ventanas'      },
  { href: '/products',      icon: '📦', label: 'Productos'     },
  { href: '/customers',     icon: '👥', label: 'Clientes'      },
  { href: '/announcements', icon: '📣', label: 'Anuncios'      },
  { href: '/settings',      icon: '⚙️',  label: 'Configuración' },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLogin  = pathname === '/login'

  if (isLogin) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Sidebar 240px — desktop (lg+) ─────────────────────────── */}
      <aside
        className="fixed left-0 top-0 z-20 hidden lg:flex h-full w-[240px] flex-col glass"
        style={{ borderRight: '1px solid var(--glass-border)' }}
      >
        {/* Logo */}
        <div
          className="flex h-16 flex-shrink-0 items-center gap-3 px-5"
          style={{ borderBottom: '1px solid var(--glass-border)' }}
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-teal-violet text-white text-sm font-bold shadow-glow">
            C
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--text)' }}>
              ColaCero
            </p>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Panel de gestión</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:opacity-80"
                style={{
                  backgroundColor: isActive ? 'var(--primary-dim)' : 'transparent',
                  color:           isActive ? 'var(--primary)' : 'var(--muted)',
                  border:          isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
                }}
              >
                <span className="text-base flex-shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div
          className="flex flex-shrink-0 items-center justify-between px-5 py-4"
          style={{ borderTop: '1px solid var(--glass-border)' }}
        >
          <span className="text-xs" style={{ color: 'var(--muted)' }}>v1.0</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="flex-1 min-h-screen lg:ml-[240px] pb-16 lg:pb-0">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>

      {/* ── Bottom nav — mobile + tablet (<lg) ────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 lg:hidden glass"
        style={{ borderTop: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center justify-around px-1 py-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className="flex flex-col items-center gap-0.5 rounded-xl px-1.5 py-1.5 transition-all min-w-0"
                style={{
                  backgroundColor: isActive ? 'var(--primary-dim)' : 'transparent',
                  color:           isActive ? 'var(--primary)' : 'var(--muted)',
                }}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="text-[8px] font-semibold leading-none truncate w-full text-center">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
