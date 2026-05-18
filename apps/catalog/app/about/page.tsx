import type { Metadata } from 'next'
import { MarketingShell } from '../../components/marketing-shell'

export const metadata: Metadata = {
  title:       'Nosotros',
  description: 'Por qué construimos ColaCero — la historia detrás del producto',
}

const CONTACT_URL = process.env['NEXT_PUBLIC_CONTACT_URL'] ?? 'https://t.me/Arielhechavarria'

export default function AboutPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
          Nosotros
        </p>
        <h1 className="mb-6 text-4xl font-black tracking-tight sm:text-5xl" style={{ color: 'var(--text)' }}>
          Hecho desde Cuba, para Cuba 🇨🇺
        </h1>

        <div className="space-y-6 text-lg leading-relaxed" style={{ color: 'var(--muted)' }}>
          <p>
            ColaCero nace de una observación simple: en Cuba, los pequeños negocios venden por mensajería —
            grupos de Telegram, listas de WhatsApp, mensajes uno a uno. Funciona, pero <strong style={{ color: 'var(--text)' }}>
            es caos.</strong> Pedidos perdidos en el chat, stock que no se actualiza, clientes que vienen
            sin avisar y se llevan lo último.
          </p>

          <p>
            Las apps internacionales no nos sirven: cobran comisiones del 20-30% por pedido, requieren
            tarjetas de crédito que muchos negocios no pueden procesar, y están pensadas para realidades
            distintas a la nuestra.
          </p>

          <p>
            <strong style={{ color: 'var(--text)' }}>ColaCero es lo que hubiéramos querido tener:</strong>
            {' '}una herramienta simple, cubana, que respeta el margen del negocio y se adapta al canal
            que ya usás (Telegram). Sin comisiones por pedido. Sin contratos. Sin sorpresas.
          </p>

          <p>
            Estamos en beta. Trabajamos directamente con los primeros 5 negocios, los acompañamos en el
            alta, escuchamos qué necesitan y construimos. La idea no es hacerla rica con vos —
            la idea es que tu negocio crezca, y vos te quedes con nosotros porque te funciona.
          </p>
        </div>

        {/* Founder card */}
        <div className="mt-12 glass rounded-3xl p-8" style={{ border: '1px solid var(--glass-border)' }}>
          <div className="flex items-start gap-5">
            <div
              className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl text-4xl font-black text-white"
              style={{ background: 'linear-gradient(135deg, #14B8A6, #8B5CF6)' }}
            >
              A
            </div>
            <div>
              <h2 className="mb-1 text-xl font-bold" style={{ color: 'var(--text)' }}>
                Ariel Hechavarría
              </h2>
              <p className="mb-3 text-sm" style={{ color: 'var(--muted)' }}>
                Founder · Desarrollador full-stack
              </p>
              <p className="leading-relaxed" style={{ color: 'var(--muted)' }}>
                15+ años haciendo software. Construyo ColaCero desde 2026 con la convicción de que
                lo digital tiene que servir a quienes producen — no al revés. Si querés probar el
                producto, escribíme directo:
              </p>
              <a
                href={CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-base font-semibold underline"
                style={{ color: 'var(--primary)' }}
              >
                @Arielhechavarria en Telegram →
              </a>
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  )
}
