'use client'

import { useState, useEffect, Fragment } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { getMe, isAuthenticatedClient, logout } from '../lib/api'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import { EmailVerificationBanner } from './email-verification-banner'
import { Logo } from './logo'

// ── Navigation config ─────────────────────────────────────────────────────────

const NAV_ITEMS = [
    { href: '/dashboard',     icon: '📊', label: 'Dashboard'  },
    { href: '/orders',        icon: '📋', label: 'Pedidos'    },
    { href: '/queue',         icon: '🍳', label: 'Cola'       },
    { href: '/windows',       icon: '🕐', label: 'Ventanas'   },
    { href: '/products',      icon: '📦', label: 'Productos'  },
    { href: '/customers',     icon: '👥', label: 'Clientes'   },
    { href: '/announcements', icon: '📣', label: 'Anuncios'   },
    { href: '/settings',      icon: '⚙️',  label: 'Config.'   },
]

const ADMIN_NAV_ITEMS = [
    { href: '/admin/businesses', icon: '👑', label: 'Admin' },
    { href: '/admin/leads',      icon: '📥', label: 'Leads' },
]

const PRIMARY_NAV   = NAV_ITEMS.slice(0, 4)
const SECONDARY_NAV = NAV_ITEMS.slice(4)

// ── NavItem ───────────────────────────────────────────────────────────────────

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
                'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-all min-w-0 flex-1 text-[10px] font-semibold leading-none',
                isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50',
            )}
        >
            <span className="text-xl leading-none">{icon}</span>
            <span className="truncate w-full text-center">{label}</span>
        </Link>
    )
}

// ── MoreSheet ─────────────────────────────────────────────────────────────────

function MoreSheet({
    open,
    onClose,
    onLogout,
    pathname,
    items,
}: {
    open: boolean
    onClose: () => void
    onLogout: () => void
    pathname: string
    items: typeof SECONDARY_NAV
}) {
    return (
        <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
            <SheetContent side="bottom" className="rounded-t-3xl pb-safe bg-white border-t border-slate-200">
                <SheetHeader className="mb-4">
                    <SheetTitle className="text-slate-900">Más opciones</SheetTitle>
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
                                    'flex flex-col items-center gap-2 rounded-2xl p-4 transition-all border',
                                    isActive
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50',
                                )}
                            >
                                <span className="text-2xl">{item.icon}</span>
                                <span className="text-xs font-semibold text-center leading-tight">{item.label}</span>
                            </Link>
                        )
                    })}
                    <button
                        onClick={onLogout}
                        className="flex flex-col items-center gap-2 rounded-2xl p-4 transition-all bg-white border border-slate-200 text-red-500 hover:bg-red-50"
                    >
                        <span className="text-2xl">🚪</span>
                        <span className="text-xs font-semibold text-center leading-tight">Salir</span>
                    </button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router   = useRouter()

    const isPublicAuth = pathname === '/login'
                      || pathname === '/forgot-password'
                      || pathname?.startsWith('/reset-password')
                      || pathname?.startsWith('/verify-email')
                      || pathname?.startsWith('/signup')

    const [moreOpen,  setMoreOpen]  = useState(false)
    const [isAdmin,   setIsAdmin]   = useState(false)
    const [collapsed, setCollapsed] = useState(false)

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

    async function handleLogout() {
        try { await logout() } catch { /* noop */ }
        router.push('/login')
    }

    useEffect(() => {
        if (isPublicAuth) return
        if (!isAuthenticatedClient()) return
        void getMe('')
            .then((u) => setIsAdmin(u.role === 'SUPER_ADMIN'))
            .catch(() => {})
    }, [pathname, isPublicAuth])

    if (isPublicAuth) return <>{children}</>

    const navItemsFull = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS
    const secondaryNav = isAdmin ? [...SECONDARY_NAV, ...ADMIN_NAV_ITEMS] : SECONDARY_NAV

    const isSecondaryActive = secondaryNav.some(
        (i) => pathname === i.href || pathname.startsWith(i.href + '/'),
    )

    return (
        <div className="flex min-h-screen bg-slate-50">

            {/* ── Sidebar — desktop (lg+) ────────────────────────────────── */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-20 hidden lg:flex h-full flex-col bg-white border-r border-slate-200 transition-[width] duration-200',
                    collapsed ? 'w-[64px]' : 'w-[240px]',
                )}
            >
                {/* Logo */}
                <div
                    className={cn(
                        'flex h-16 flex-shrink-0 items-center border-b border-slate-100',
                        collapsed ? 'px-3 justify-center' : 'px-5',
                    )}
                >
                    {collapsed ? (
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                            <svg width="18" height="15" viewBox="0 0 42 34" fill="none">
                                <path d="M4 17 C4 17 7.5 10 12 17 C16.5 24 21 12 25 17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                                <line x1="25" y1="17" x2="37" y2="17" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
                                <polyline points="33,12 38,17 33,22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                            </svg>
                        </div>
                    ) : (
                        <Logo size="sm" variant="sidebar" />
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
                                    <div className="my-2 mx-1 h-px bg-slate-100" />
                                )}
                                <Link
                                    href={item.href}
                                    title={collapsed ? item.label : undefined}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150',
                                        collapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5',
                                        isActive
                                            ? 'bg-indigo-50 text-indigo-600'
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
                                    )}
                                >
                                    <span className="text-base flex-shrink-0">{item.icon}</span>
                                    {!collapsed && <span className="truncate">{item.label}</span>}
                                </Link>
                            </Fragment>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div
                    className={cn(
                        'flex flex-shrink-0 items-center gap-2 py-3 border-t border-slate-100',
                        collapsed ? 'flex-col px-2' : 'px-4',
                    )}
                >
                    <button
                        onClick={toggleCollapsed}
                        title={collapsed ? 'Expandir' : 'Colapsar'}
                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                        aria-label="Toggle sidebar"
                    >
                        <span className="text-sm">{collapsed ? '⇥' : '⇤'}</span>
                    </button>
                    {!collapsed && <div className="flex-1" />}
                    <button
                        onClick={() => void handleLogout()}
                        title="Cerrar sesión"
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                        <span className="text-sm">🚪</span>
                    </button>
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
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                    {children}
                </motion.div>
            </main>

            {/* ── Bottom nav — mobile (<lg) ──────────────────────────────── */}
            <nav className="fixed bottom-0 left-0 right-0 z-20 lg:hidden bg-white border-t border-slate-200">
                <div className="flex items-center justify-around px-1 py-1 pb-safe">
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

                    <button
                        onClick={() => setMoreOpen(true)}
                        className={cn(
                            'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-all min-w-0 flex-1 text-[10px] font-semibold leading-none',
                            isSecondaryActive
                                ? 'bg-indigo-50 text-indigo-600'
                                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50',
                        )}
                    >
                        <span className="text-xl leading-none">···</span>
                        <span>Más</span>
                    </button>
                </div>
            </nav>

            <MoreSheet
                open={moreOpen}
                onClose={() => setMoreOpen(false)}
                onLogout={() => { setMoreOpen(false); void handleLogout() }}
                pathname={pathname}
                items={secondaryNav}
            />
        </div>
    )
}
