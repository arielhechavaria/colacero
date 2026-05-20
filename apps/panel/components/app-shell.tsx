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

import { useState, useEffect, Fragment } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ThemeToggle } from './theme-toggle'
import { getMe, isAuthenticatedClient } from '../lib/api'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { EmailVerificationBanner } from './email-verification-banner'

// ── Navigation config ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
    { href: '/dashboard',     icon: '📊', label: 'Dashboard'     },
    { href: '/orders',        icon: '📋', label: 'Pedidos'       },
    { href: '/queue',         icon: '🍳', label: 'Cola'          },
    { href: '/windows',       icon: '🕐', label: 'Ventanas'      },
    { href: '/products',      icon: '📦', label: 'Productos'     },
    { href: '/customers',     icon: '👥', label: 'Clientes'      },
    { href: '/announcements', icon: '📣', label: 'Anuncios'      },
    { href: '/settings',      icon: '⚙️',  label: 'Config.'      },
]

const ADMIN_NAV_ITEMS = [
    { href: '/admin/businesses', icon: '👑', label: 'Admin'   },
    { href: '/admin/leads',      icon: '📥', label: 'Leads'   },
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
            {...(onClick ? { onClick } : {})}
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
                       items,
                   }: {
    open: boolean
    onClose: () => void
    pathname: string
    items: typeof SECONDARY_NAV
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
                    {items.map((item) => {
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
    const isPublicAuth = pathname === '/login'
                      || pathname === '/forgot-password'
                      || pathname?.startsWith('/reset-password')
                      || pathname?.startsWith('/verify-email')
                      || pathname?.startsWith('/signup')
    const [moreOpen, setMoreOpen] = useState(false)
    const [isAdmin,  setIsAdmin]  = useState(false)
    const [collapsed, setCollapsed] = useState(false)

    // Hydrate collapsed state from localStorage (lg+ only)
    useEffect(() => {
        try {
            const saved = localStorage.getItem('panel.sidebar.collapsed')
            if (saved === '1') setCollapsed(true)
        } catch {}
    }, [])

    function toggleCollapsed() {
        setCollapsed((prev) => {
            const next = !prev
            try { localStorage.setItem('panel.sidebar.collapsed', next ? '1' : '0') } catch {}
            return next
        })
    }

    // Detectar SUPER_ADMIN para mostrar nav extra
    useEffect(() => {
        if (isPublicAuth) return
        if (!isAuthenticatedClient()) return
        void getMe('')
            .then((u) => setIsAdmin(u.role === 'SUPER_ADMIN'))
            .catch(() => { /* noop */ })
    }, [pathname, isPublicAuth])

    if (isPublicAuth) {
        return <>{children}</>
    }

    const navItemsFull = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS
    const secondaryNav = isAdmin ? [...SECONDARY_NAV, ...ADMIN_NAV_ITEMS] : SECONDARY_NAV

    return (
        <div className="flex min-h-screen">
            {/* ── Sidebar — desktop (lg+) - colapsable ─────────────────────── */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-20 hidden lg:flex h-full flex-col glass transition-[width] duration-200',
                    collapsed ? 'w-[64px]' : 'w-[240px]',
                )}
                style={{ borderRight: '1px solid var(--glass-border)' }}
            >
                {/* Logo */}
                <div
                    className={cn(
                        'flex h-16 flex-shrink-0 items-center gap-3',
                        collapsed ? 'px-3 justify-center' : 'px-5',
                    )}
                    style={{ borderBottom: '1px solid var(--glass-border)' }}
                >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-teal-violet text-white text-sm font-bold shadow-glow">
                        C
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--text)' }}>
                                ColaCero
                            </p>
                            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>Panel de gestión</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-3 py-3">
                    {navItemsFull.map((item, idx) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        const showDividerBefore = idx === NAV_ITEMS.length && isAdmin
                        return (
                            <Fragment key={item.href}>
                                {showDividerBefore && (
                                    <div
                                        className="my-2 mx-1 h-px"
                                        style={{ background: 'var(--glass-border)' }}
                                    />
                                )}
                                <Link
                                    href={item.href}
                                    title={collapsed ? item.label : undefined}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150 border',
                                        collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5',
                                        isActive
                                            ? 'bg-[var(--primary-dim)] text-[var(--primary)] border-[var(--border-glow)]'
                                            : 'text-[var(--muted)] border-transparent hover:bg-[var(--primary-dim)] hover:text-[var(--primary)]',
                                    )}
                                >
                                    <span className="text-base flex-shrink-0">{item.icon}</span>
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                </Link>
                            </Fragment>
                        )
                    })}
                </nav>

                {/* Footer — toggle + theme */}
                <div
                    className={cn(
                        'flex flex-shrink-0 items-center gap-2 py-4',
                        collapsed ? 'flex-col px-2' : 'justify-between px-5',
                    )}
                    style={{ borderTop: '1px solid var(--glass-border)' }}
                >
                    <button
                        onClick={toggleCollapsed}
                        title={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
                        className="rounded-lg p-2 transition-colors hover:bg-[var(--primary-dim)]"
                        style={{ color: 'var(--muted)' }}
                        aria-label="Toggle sidebar"
                    >
                        <span className="text-base">{collapsed ? '⇥' : '⇤'}</span>
                    </button>
                    {!collapsed && (
                        <>
                            <span className="text-xs" style={{ color: 'var(--muted)' }}>v1.0</span>
                            <ThemeToggle />
                        </>
                    )}
                    {collapsed && <ThemeToggle />}
                </div>
            </aside>

            {/* ── Main content ──────────────────────────────────────────── */}
            <main
                className={cn(
                    'flex-1 min-h-screen pb-16 lg:pb-0 transition-[margin] duration-200',
                    collapsed ? 'lg:ml-[64px]' : 'lg:ml-[240px]',
                )}
            >
                <EmailVerificationBanner />
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
                            secondaryNav.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))
                                ? 'bg-[var(--primary-dim)]'
                                : '',
                        )}
                        style={{
                            color: secondaryNav.some(i => pathname === i.href || pathname.startsWith(i.href + '/'))
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
                items={secondaryNav}
            />
        </div>
    )
}
