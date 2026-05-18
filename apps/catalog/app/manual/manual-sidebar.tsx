'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  { href: '/manual',               label: 'Introducción',  icon: '📘' },
  { href: '/manual/empezar',       label: 'Empezar',        icon: '🚀' },
  { href: '/manual/productos',     label: 'Productos',      icon: '📦' },
  { href: '/manual/ventanas',      label: 'Ventanas',       icon: '🕐' },
  { href: '/manual/pedidos',       label: 'Pedidos',        icon: '📋' },
  { href: '/manual/analytics',     label: 'Analytics',      icon: '📊' },
  { href: '/manual/configuracion', label: 'Configuración',  icon: '⚙️' },
]

export function ManualSidebar() {
  const pathname = usePathname()

  return (
    <aside className="lg:sticky lg:top-8 lg:self-start">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
        Manual
      </p>
      <nav className="flex flex-col gap-1">
        {SECTIONS.map((s) => {
          const isActive = pathname === s.href
          return (
            <Link
              key={s.href}
              href={s.href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all ${
                isActive ? 'glass font-semibold' : 'hover:bg-white/5'
              }`}
              style={{ color: isActive ? 'var(--primary)' : 'var(--muted)' }}
            >
              <span className="text-base">{s.icon}</span>
              <span>{s.label}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
