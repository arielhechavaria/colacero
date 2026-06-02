import Link from 'next/link'
import type { Metadata } from 'next'
import { MarketingShell } from '../../components/marketing-shell'
import { ManualSidebar } from './manual-sidebar'

export const metadata: Metadata = {
  title:       'Manual de usuario',
  description: 'Guía paso a paso para usar ColaCero en tu negocio',
}

export const MANUAL_SECTIONS = [
  { href: '/manual',               label: 'Introducción',  icon: '📘' },
  { href: '/manual/empezar',       label: 'Empezar',        icon: '🚀' },
  { href: '/manual/productos',     label: 'Productos',      icon: '📦' },
  { href: '/manual/ventanas',      label: 'Ventanas',       icon: '🕐' },
  { href: '/manual/pedidos',       label: 'Pedidos',        icon: '📋' },
  { href: '/manual/analytics',     label: 'Analytics',      icon: '📊' },
  { href: '/manual/configuracion', label: 'Configuración',  icon: '⚙️' },
  { href: '/manual/prueba-piloto', label: 'Prueba piloto',  icon: '🧪' },
]

export default function ManualLayout({ children }: { children: React.ReactNode }) {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-6xl px-6 py-8 lg:py-12">
        <nav className="mb-6 text-xs" style={{ color: 'var(--muted)' }}>
          <Link href="/" className="hover:opacity-80">Inicio</Link>
          <span className="mx-2">/</span>
          <Link href="/manual" className="hover:opacity-80">Manual</Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
          <ManualSidebar />
          <article className="min-w-0 max-w-2xl">{children}</article>
        </div>
      </div>
    </MarketingShell>
  )
}
