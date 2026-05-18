import Link from 'next/link'
import type { Metadata } from 'next'
import { MarketingShell } from '../../components/marketing-shell'

export const metadata: Metadata = {
  title:       'Precios',
  description: 'Gratis durante el beta. Sin comisiones por pedido. Sin contratos.',
}

const CONTACT_URL = process.env['NEXT_PUBLIC_CONTACT_URL'] ?? 'https://t.me/Arielhechavarria'

export default function PreciosPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
          Precios
        </p>
        <h1 className="mb-4 text-5xl font-black tracking-tight sm:text-6xl" style={{ color: 'var(--text)' }}>
          Gratis durante el beta
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-lg" style={{ color: 'var(--muted)' }}>
          Mientras estamos validando con los primeros negocios, todo es sin costo. Sin comisiones por pedido.
          Sin tarjeta de crédito. Sin contratos.
        </p>

        {/* Plan card */}
        <div
          className="glass relative mx-auto mb-12 max-w-md rounded-3xl p-8 sm:p-10"
          style={{ border: '1px solid var(--glass-border)' }}
        >
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
            style={{ background: 'linear-gradient(135deg, #14B8A6 0%, #8B5CF6 100%)' }}
          >
            Plan Beta
          </div>
          <p className="mb-2 text-6xl font-black" style={{ color: 'var(--text)' }}>$0</p>
          <p className="mb-8 text-sm" style={{ color: 'var(--muted)' }}>por mes</p>

          <ul className="mb-8 space-y-3 text-left text-sm">
            {[
              'Catálogo público en tu subdominio',
              'Panel de gestión completo',
              'Auth por Telegram para clientes',
              'Inventario con reservas automáticas',
              'Ventanas de recogida ilimitadas',
              'Analytics + stock alerts',
              'Productos y pedidos ilimitados',
              'Soporte directo por Telegram',
            ].map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-0.5 text-emerald-500">✓</span>
                <span style={{ color: 'var(--text)' }}>{f}</span>
              </li>
            ))}
          </ul>

          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-teal-violet shadow-glow block rounded-xl px-6 py-3 text-base font-semibold text-white hover:opacity-90"
          >
            Empezar gratis →
          </a>
        </div>

        {/* Future pricing note */}
        <div className="mx-auto max-w-2xl rounded-2xl border p-6 text-left text-sm" style={{ borderColor: 'var(--glass-border)' }}>
          <p className="mb-2 font-semibold" style={{ color: 'var(--text)' }}>
            💬 ¿Qué pasa después del beta?
          </p>
          <p style={{ color: 'var(--muted)' }}>
            Cuando salgamos de beta vamos a evaluar un pricing simple, fijo y por mes — sin comisiones por
            pedido, ni ahora ni después. La idea es que un negocio chico pueda pagarlo sin sufrir y que se
            mantenga predecible. Te avisamos con tiempo y, si ya estás usándolo, te respetamos el precio inicial.
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Link href="/faq" className="hover:opacity-80" style={{ color: 'var(--muted)' }}>
            Ver preguntas frecuentes →
          </Link>
        </div>
      </div>
    </MarketingShell>
  )
}
