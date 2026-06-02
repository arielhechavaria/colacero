import Link from 'next/link'
import type { ReactNode } from 'react'

export function H1({ children }: { children: ReactNode }) {
  return (
    <h1 className="mb-3 text-4xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
      {children}
    </h1>
  )
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <p className="mb-10 text-lg leading-relaxed" style={{ color: 'var(--muted)' }}>
      {children}
    </p>
  )
}

export function H2({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mt-12 mb-4 scroll-mt-24 text-2xl font-bold tracking-tight"
      style={{ color: 'var(--text)' }}
    >
      {children}
    </h2>
  )
}

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="mt-8 mb-3 text-lg font-bold" style={{ color: 'var(--text)' }}>
      {children}
    </h3>
  )
}

export function P({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
      {children}
    </p>
  )
}

export function Strong({ children }: { children: ReactNode }) {
  return (
    <strong className="font-semibold" style={{ color: 'var(--text)' }}>
      {children}
    </strong>
  )
}

export function Ul({ children }: { children: ReactNode }) {
  return (
    <ul className="mb-4 ml-6 list-disc space-y-2" style={{ color: 'var(--muted)' }}>
      {children}
    </ul>
  )
}

export function Ol({ children }: { children: ReactNode }) {
  return (
    <ol className="mb-4 ml-6 list-decimal space-y-2" style={{ color: 'var(--muted)' }}>
      {children}
    </ol>
  )
}

export function Note({ tone = 'info', children }: { tone?: 'info' | 'tip' | 'warning'; children: ReactNode }) {
  const palette = {
    info:    { bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.25)',  icon: '💡' },
    tip:     { bg: 'rgba(20,184,166,0.08)',  border: 'rgba(20,184,166,0.25)',  icon: '✅' },
    warning: { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  icon: '⚠️' },
  }[tone]

  return (
    <aside
      className="my-6 flex gap-3 rounded-2xl border p-4 text-sm"
      style={{ backgroundColor: palette.bg, borderColor: palette.border }}
    >
      <span className="flex-shrink-0 text-lg">{palette.icon}</span>
      <div className="leading-relaxed [&>p]:mb-0" style={{ color: 'var(--text)' }}>
        {children}
      </div>
    </aside>
  )
}

export function ScreenshotPlaceholder({ caption }: { caption?: string }) {
  return (
    <figure className="my-8">
      <div
        className="flex aspect-[16/10] items-center justify-center rounded-2xl border-2 border-dashed text-sm"
        style={{
          borderColor: 'var(--glass-border)',
          background: 'linear-gradient(135deg, rgba(20,184,166,0.05), rgba(139,92,246,0.05))',
          color:       'var(--muted)',
        }}
      >
        <span>🖼 Captura próximamente</span>
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-xs" style={{ color: 'var(--muted)' }}>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

export function Step({
  n,
  title,
  children,
}: {
  n: number
  title: string
  children?: ReactNode
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-3">
        <span
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
          style={{ background: 'var(--primary)' }}
        >
          {n}
        </span>
        <h3 className="text-lg font-bold" style={{ color: 'var(--text)' }}>
          {title}
        </h3>
      </div>
      {children && (
        <div className="ml-11">{children}</div>
      )}
    </div>
  )
}

export function CheckList({ children }: { children: ReactNode }) {
  return (
    <ul className="mb-4 space-y-2" style={{ color: 'var(--muted)' }}>
      {children}
    </ul>
  )
}

export function CheckItem({
  status = 'todo',
  children,
}: {
  status?: 'ok' | 'warn' | 'todo'
  children: ReactNode
}) {
  const icon = status === 'ok' ? '✅' : status === 'warn' ? '⚠️' : '☐'
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed">
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <span>{children}</span>
    </li>
  )
}

export function PrevNext({
  prev,
  next,
}: {
  prev?: { href: string; label: string }
  next?: { href: string; label: string }
}) {
  return (
    <nav
      className="mt-16 grid gap-3 border-t pt-8 sm:grid-cols-2"
      style={{ borderColor: 'var(--glass-border)' }}
    >
      {prev ? (
        <Link href={prev.href} className="glass rounded-2xl p-4 hover:opacity-90">
          <span className="block text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            ← Anterior
          </span>
          <span className="mt-1 block font-semibold" style={{ color: 'var(--text)' }}>
            {prev.label}
          </span>
        </Link>
      ) : <span />}
      {next ? (
        <Link href={next.href} className="glass rounded-2xl p-4 text-right hover:opacity-90">
          <span className="block text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Siguiente →
          </span>
          <span className="mt-1 block font-semibold" style={{ color: 'var(--text)' }}>
            {next.label}
          </span>
        </Link>
      ) : <span />}
    </nav>
  )
}
