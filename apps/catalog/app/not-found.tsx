import Link from 'next/link'
import { Logo } from '../components/logo'

export default function RootNotFound() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed top-1/4 left-1/4 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #14B8A6, transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-1/4 right-1/4 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #8B5CF6, transparent)' }}
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo size="md" />
      </header>

      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center px-6 py-20 text-center">
        <p
          className="mb-4 text-8xl font-black tracking-tight bg-gradient-teal-violet bg-clip-text text-transparent"
        >
          404
        </p>
        <h1 className="mb-3 text-3xl font-bold" style={{ color: 'var(--text)' }}>
          Esta página no existe o se mudó
        </h1>
        <p className="mb-8 max-w-md" style={{ color: 'var(--muted)' }}>
          Verificá la dirección. Si llegaste acá por un link viejo, puede que el negocio ya no esté activo en ColaCero.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="bg-gradient-teal-violet shadow-glow rounded-xl px-6 py-3 text-base font-semibold text-white hover:opacity-90"
          >
            Ir a colacero.com
          </Link>
          <Link
            href="/contacto"
            className="rounded-xl px-6 py-3 text-base font-semibold glass hover:opacity-90"
            style={{ color: 'var(--text)' }}
          >
            Contacto
          </Link>
        </div>
      </div>
    </main>
  )
}
