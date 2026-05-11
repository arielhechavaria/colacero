'use client'

/**
 * PATCH: apps/panel/components/app-shell.tsx
 *
 * PROBLEMA: Bottom nav muestra 8 ítems a text-[8px]. Ilegible, inaccesible,
 *           labels truncados ("Cola de prep.", "Configuración").
 *
 * FIX:
 *   - Dividir en PRIMARY (4 ítems) + SECONDARY (4 ítems)
 *   - Agregar botón "Más" que abre un Sheet de shadcn/ui
 *   - Subir labels a text-[10px] e íconos a text-xl
 *   - Agregar Sheet a panel: npx shadcn@latest add sheet
 */

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'

// ── Navigation config ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
    { href: '/dashboard',     icon: '📊', label: 'Dashboard'     },
    { href: '/orders',        icon: '📋', label: 'Pedidos'       },
    { href: '/queue',         icon: '🍳', label: 'Cola'          }, // ← Label acortado
    { href: '/windows',       icon: '🕐', label: 'Ventanas'      },
    { href: '/products',      icon: '📦', label: 'Productos'     },
    { href: '/customers',     icon: '👥', label: 'Clientes'      },
    { href: '/announcements', icon: '📣', label: 'Anuncios'      },
    { href: '/settings',      icon: '⚙️',  label: 'Config.'      }, // ← Label acortado
]

/** Ítems visibles siempre en la barra inferior */
const PRIMARY_NAV = NAV_ITEMS.slice(0, 4)

/** Ítems accesibles desde el sheet "Más" */
const SECONDARY_NAV = NAV_ITEMS.slice(4)

// ── Sub-componente: NavItem ───────────────────────────────────────────────────

function NavItem({
                     href,
                     icon,
                     label,
                     isActive,
                     onClick,
                 }: {
    href: string
    icon: string
    label: string
    isActive: boolean
    onClick?: () => void
}) {
    return (
        <Link
            href={href}
            title={label}
            onClick={onClick}
            className={cn(
                'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-all min-w-0 flex-1',
            )}
            style={{
                backgroundColor: isActive ? 'var(--primary-dim)' : 'transparent',
                color:           isActive ? 'var(--primary)'     : 'var(--muted)',
            }}
        >
            {/* Ícono: subido de text-base a text-xl para mejor legibilidad */}
            <span className="text-xl leading-none">{icon}</span>
            {/* Label: subido de text-[8px] a text-[10px] */}
            <span className="text-[10px] font-semibold leading-none truncate w-full text-center">
        {label}
      </span>
        </Link>
    )
}

// ── Sub-componente: MoreSheet ─────────────────────────────────────────────────

function MoreSheet({
                       open,
                       onClose,
                       pathname,
                   }: {
    open: boolean
    onClose: () => void
    pathname: string
}) {
    return (
        <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
            <SheetContent
                side="bottom"
                className="rounded-t-3xl pb-safe"
                style={{
                    background:   'var(--glass-bg)',
                    backdropFilter: 'blur(20px)',
                    border:       '1px solid var(--glass-border)',
                    borderBottom: 'none',
                }}
            >
                <SheetHeader className="mb-4">
                    <SheetTitle style={{ color: 'var(--text)' }}>
                        Más opciones
                    </SheetTitle>
                </SheetHeader>

                <div className="grid grid-cols-4 gap-3 pb-6">
                    {SECONDARY_NAV.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={cn(
                                    'flex flex-col items-center gap-2 rounded-2xl p-4 transition-all',
                                )}
                                style={{
                                    backgroundColor: isActive ? 'var(--primary-dim)' : 'var(--surface)',
                                    border:          isActive ? '1px solid var(--border-glow)' : '1px solid var(--border)',
                                    color:           isActive ? 'var(--primary)' : 'var(--text)',
                                }}
                            >
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-xs font-semibold text-center leading-tight">
                  {item.label}
                </span>
                            </Link>
                        )
                    })}
                </div>
            </SheetContent>
        </Sheet>
    )
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const isLogin  = pathname === '/login'
    const [moreOpen, setMoreOpen] = useState(false)

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

                {/* Navigation — todos los ítems en desktop */}
                <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-3">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 border',
                                    isActive
                                        ? 'bg-[var(--primary-dim)] text-[var(--primary)] border-[var(--border-glow)]'
                                        : 'text-[var(--muted)] border-transparent hover:bg-[var(--primary-dim)] hover:text-[var(--primary)]',
                                )}
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
                <div className="flex items-center justify-around px-1 py-1 pb-safe">
                    {/* 4 ítems primarios */}
                    {PRIMARY_NAV.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <NavItem
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                                isActive={isActive}
                            />
                        )
                    })}

                    {/* Botón "Más" */}
                    <button
                        onClick={() => setMoreOpen(true)}
                        className={cn(
                            'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-all min-w-0 flex-1',
                            // Resaltar si la ruta activa es una secundaria
                            SECONDARY_NAV.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))
                                ? 'bg-[var(--primary-dim)]'
                                : '',
                        )}
                        style={{
                            color: SECONDARY_NAV.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))
                                ? 'var(--primary)'
                                : 'var(--muted)',
                        }}
                    >
                        <span className="text-xl leading-none">···</span>
                        <span className="text-[10px] font-semibold leading-none">Más</span>
                    </button>
                </div>
            </nav>

            {/* Sheet de navegación secundaria */}
            <MoreSheet
                open={moreOpen}
                onClose={() => setMoreOpen(false)}
                pathname={pathname}
            />
        </div>
    )
}
