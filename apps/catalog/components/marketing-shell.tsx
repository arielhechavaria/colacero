import Link from 'next/link'
import type { ReactNode } from 'react'
import { Logo } from './logo'

const PANEL_URL    = process.env['NEXT_PUBLIC_PANEL_URL']    ?? 'https://panel.colacero.com'
const CONTACT_URL  = process.env['NEXT_PUBLIC_CONTACT_URL']  ?? 'https://t.me/Arielhechavarria'
const DEMO_BIZ_URL = 'https://el-fogon.colacero.com'

const NAV_LINKS = [
  { href: '/manual',   label: 'Manual'   },
  { href: '/precios',  label: 'Precios'  },
  { href: '/faq',      label: 'FAQ'      },
  { href: '/about',    label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
]

export function MarketingHeader() {
  return (
    <header className="relative z-20 border-b" style={{ borderColor: 'var(--glass-border)' }}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex-shrink-0">
          <Logo size="md" />
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex" style={{ color: 'var(--muted)' }}>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:opacity-80 transition-opacity">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`${PANEL_URL}/login`}
            className="rounded-xl px-4 py-2 font-medium glass hover:opacity-90"
            style={{ color: 'var(--text)' }}
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  )
}

export function MarketingFooter() {
  return (
    <footer className="relative z-10 mt-20 border-t" style={{ borderColor: 'var(--glass-border)' }}>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo size="sm" />
            <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>
              Recibí pedidos por Telegram.<br />Cero comisiones.
            </p>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Producto
            </p>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
              <li><a href={DEMO_BIZ_URL} className="hover:opacity-80">Ver demo</a></li>
              <li><Link href="/precios" className="hover:opacity-80">Precios</Link></li>
              <li><Link href="/faq" className="hover:opacity-80">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Recursos
            </p>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
              <li><Link href="/manual" className="hover:opacity-80">Manual de usuario</Link></li>
              <li><Link href="/about" className="hover:opacity-80">Nosotros</Link></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Contacto
            </p>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--muted)' }}>
              <li><a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className="hover:opacity-80">Telegram ↗</a></li>
              <li><Link href="/contacto" className="hover:opacity-80">Form de contacto</Link></li>
              <li><Link href={`${PANEL_URL}/login`} className="hover:opacity-80">Iniciar sesión</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t flex flex-col items-center justify-between gap-3 sm:flex-row" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            © 2026 ColaCero · Hecho desde Cuba 🇨🇺
          </p>
        </div>
      </div>
    </footer>
  )
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed top-0 left-1/4 h-[500px] w-[500px] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #14B8A6, transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-0 right-1/4 h-[500px] w-[500px] rounded-full opacity-15 blur-3xl"
        style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }}
      />
      <MarketingHeader />
      <div className="relative z-10">{children}</div>
      <MarketingFooter />
    </main>
  )
}
