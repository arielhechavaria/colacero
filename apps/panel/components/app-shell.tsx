'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
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
      {/* ── Sidebar 80px glass (desktop only) ───────────────────────── */}
      <aside
        className="fixed left-0 top-0 z-20 hidden md:flex h-full w-20 flex-col glass border-r-0"
        style={{ borderRight: '1px solid var(--glass-border)' }}
      >
        {/* Logo mark */}
        <div className="flex h-16 flex-shrink-0 items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-teal-violet text-white text-sm font-bold shadow-glow">
            C
          </div>
        </div>

        {/* Navigation — icons only */}
        <nav className="flex flex-1 flex-col items-center gap-1 py-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-xl transition-all"
                style={{
                  backgroundColor: isActive ? 'var(--primary-dim)' : 'transparent',
                  border:          isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
                }}
              >
                <span>{item.icon}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="flex flex-shrink-0 flex-col items-center gap-3 py-4">
          <ThemeToggle />
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────────── */}
      <main className="flex-1 min-h-screen md:ml-20 pb-16 md:pb-0">
        {children}
      </main>

      {/* ── Bottom nav (mobile only) ─────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 md:hidden glass"
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
