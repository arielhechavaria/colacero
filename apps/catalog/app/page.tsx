import { LeadForm } from '../components/lead-form'
import { MarketingHeader, MarketingFooter } from '../components/marketing-shell'
import { LandingHero } from '../components/landing-hero'
import { LandingFeatures, LandingSteps, LandingStats, LandingPricing } from '../components/landing-sections'

export const metadata = {
  title:       'ColaCero — Recibí pedidos por Telegram. Cero comisiones.',
  description: 'Plataforma para negocios cubanos: catálogo, panel y pedidos por Telegram. Sin comisiones.',
}

const CONTACT_URL = process.env['NEXT_PUBLIC_CONTACT_URL'] ?? 'https://t.me/Arielhechavarria'

export default function LandingPage() {
  return (
    <div className="bg-[#070D1B] min-h-screen">
      <MarketingHeader dark />

      {/* Hero */}
      <LandingHero />

      {/* Stats bar */}
      <LandingStats />

      {/* Features */}
      <LandingFeatures />

      {/* How it works */}
      <LandingSteps />

      {/* Pricing */}
      <LandingPricing />

      {/* Lead capture */}
      <section className="relative bg-[#070D1B] px-6 pb-32 pt-8">
        {/* Gradient glow behind the section */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div
            className="absolute -bottom-20 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #6366F1, transparent 70%)' }}
          />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">
                Beta cerrada
              </p>
              <h2 className="mb-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                ¿Tenés un negocio en Cuba?
              </h2>
              <p className="mb-6 text-base text-slate-400 leading-relaxed">
                Estamos buscando 5 negocios para acompañar en el alta.
                Dejá tus datos y te escribimos — o si querés algo rápido, escribinos directo.
              </p>
              <a
                href={CONTACT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[#229ED9]/30 bg-[#229ED9]/10 px-6 py-3 font-semibold text-[#54b9e8] hover:bg-[#229ED9]/20 transition-colors duration-200"
              >
                <span>✈️</span>
                Escribir por Telegram
              </a>
            </div>

            {/* Form — renders as white card on dark bg, high contrast intentional */}
            <LeadForm source="landing" />
          </div>
        </div>
      </section>

      <MarketingFooter dark />
    </div>
  )
}
