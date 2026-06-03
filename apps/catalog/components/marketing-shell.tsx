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

export function MarketingHeader({ dark = false }: { dark?: boolean }) {
  return (
    <header
      className={
        dark
          ? 'sticky top-0 z-50 border-b border-white/[0.08] bg-[#070D1B]/80 backdrop-blur-md'
          : 'sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-sm'
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex-shrink-0">
          <Logo size="md" variant={dark ? 'sidebar' : 'page'} />
        </Link>
        <nav
          className={`hidden items-center gap-6 text-sm font-medium md:flex ${dark ? 'text-slate-400' : 'text-slate-500'}`}
        >
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`transition-colors ${dark ? 'hover:text-white' : 'hover:text-slate-900'}`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`${PANEL_URL}/login`}
            className={
              dark
                ? 'rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-medium text-slate-200 hover:bg-white/10 transition-colors'
                : 'rounded-xl border border-slate-200 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-50 transition-colors'
            }
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  )
}

export function MarketingFooter({ dark = false }: { dark?: boolean }) {
  const mutedClass = dark ? 'text-slate-500' : 'text-slate-500'
  const borderClass = dark ? 'border-white/[0.08]' : 'border-slate-200'
  const hoverClass = dark ? 'hover:text-slate-300' : 'hover:text-slate-900'
  const labelClass = dark ? 'text-slate-600' : 'text-slate-400'

  return (
    <footer className={`relative z-10 border-t ${dark ? 'bg-[#070D1B] border-white/[0.06]' : `border-slate-200`}`}>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <Logo size="sm" variant={dark ? 'sidebar' : 'page'} />
            <p className={`mt-3 text-xs ${mutedClass}`}>
              Recibí pedidos por Telegram.<br />Cero comisiones.
            </p>
          </div>
          <div>
            <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${labelClass}`}>Producto</p>
            <ul className={`space-y-2 text-sm ${mutedClass}`}>
              <li><a href={DEMO_BIZ_URL} className={`transition-colors ${hoverClass}`}>Ver demo</a></li>
              <li><Link href="/precios" className={`transition-colors ${hoverClass}`}>Precios</Link></li>
              <li><Link href="/faq" className={`transition-colors ${hoverClass}`}>FAQ</Link></li>
            </ul>
          </div>
          <div>
            <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${labelClass}`}>Recursos</p>
            <ul className={`space-y-2 text-sm ${mutedClass}`}>
              <li><Link href="/manual" className={`transition-colors ${hoverClass}`}>Manual de usuario</Link></li>
              <li><Link href="/about" className={`transition-colors ${hoverClass}`}>Nosotros</Link></li>
            </ul>
          </div>
          <div>
            <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${labelClass}`}>Contacto</p>
            <ul className={`space-y-2 text-sm ${mutedClass}`}>
              <li><a href={CONTACT_URL} target="_blank" rel="noopener noreferrer" className={`transition-colors ${hoverClass}`}>Telegram ↗</a></li>
              <li><Link href="/contacto" className={`transition-colors ${hoverClass}`}>Form de contacto</Link></li>
              <li><Link href={`${PANEL_URL}/login`} className={`transition-colors ${hoverClass}`}>Iniciar sesión</Link></li>
            </ul>
          </div>
        </div>
        <div className={`mt-10 pt-6 border-t flex flex-col items-center justify-between gap-3 sm:flex-row ${borderClass}`}>
          <p className={`text-xs ${mutedClass}`}>© 2026 ColaCero · Hecho desde Cuba 🇨🇺</p>
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
