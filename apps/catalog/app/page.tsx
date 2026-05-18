import { LeadForm } from '../components/lead-form'
import { MarketingHeader, MarketingFooter } from '../components/marketing-shell'

export const metadata = {
  title:       'ColaCero — Recibí pedidos por Telegram',
  description: 'Plataforma para negocios cubanos: catálogo, panel y pedidos por Telegram. Sin comisiones.',
}

const CONTACT_URL  = process.env['NEXT_PUBLIC_CONTACT_URL']  ?? 'https://t.me/Arielhechavarria'
const DEMO_BIZ_URL = 'https://el-fogon.colacero.com'

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden">
      {/* Background orbs */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-1/4 left-1/4 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6366F1, transparent)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-1/4 right-1/4 h-96 w-96 rounded-full opacity-25 blur-3xl"
        style={{ background: 'radial-gradient(circle, #14B8A6, transparent)' }}
      />

      {/* Header (shared) */}
      <MarketingHeader />

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-12 pb-20 text-center sm:pt-20 sm:pb-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium glass">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span style={{ color: 'var(--muted)' }}>Beta — buscando 5 negocios cubanos</span>
        </div>

        <h1
          className="mb-6 text-4xl font-black leading-tight tracking-tight sm:text-6xl"
          style={{ color: 'var(--text)' }}
        >
          Recibí pedidos por Telegram.{' '}
          <span className="bg-gradient-teal-violet bg-clip-text text-transparent">
            Cero comisiones.
          </span>
        </h1>

        <p className="mx-auto mb-10 max-w-2xl text-lg sm:text-xl" style={{ color: 'var(--muted)' }}>
          Tu negocio en línea con catálogo, reservas de stock y notificaciones a tus clientes — sin pagar por pedido, sin intermediarios.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-teal-violet shadow-glow rounded-xl px-7 py-3 text-base font-semibold text-white hover:opacity-90"
          >
            Quiero probarlo →
          </a>
          <a
            href={DEMO_BIZ_URL}
            className="rounded-xl px-7 py-3 text-base font-semibold glass hover:opacity-90"
            style={{ color: 'var(--text)' }}
          >
            Ver demo en vivo
          </a>
        </div>

        <p className="mt-6 text-xs" style={{ color: 'var(--muted)' }}>
          Gratis durante el beta · Sin tarjeta · Sin contratos
        </p>
      </section>

      {/* Features grid */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        <h2
          className="mb-3 text-center text-3xl font-bold sm:text-4xl"
          style={{ color: 'var(--text)' }}
        >
          Todo lo que necesitás
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center" style={{ color: 'var(--muted)' }}>
          Una plataforma diseñada para la realidad de los negocios cubanos.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-6"
              style={{ border: '1px solid var(--glass-border)' }}
            >
              <div className="mb-3 text-3xl">{f.icon}</div>
              <h3 className="mb-2 text-lg font-bold" style={{ color: 'var(--text)' }}>
                {f.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <h2
          className="mb-12 text-center text-3xl font-bold sm:text-4xl"
          style={{ color: 'var(--text)' }}
        >
          Cómo funciona
        </h2>

        <div className="grid gap-8 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-teal-violet text-xl font-black text-white shadow-glow">
                {i + 1}
              </div>
              <h3 className="mb-2 text-lg font-bold" style={{ color: 'var(--text)' }}>
                {s.title}
              </h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-20">
        <div className="glass rounded-3xl p-8 text-center sm:p-12" style={{ border: '1px solid var(--glass-border)' }}>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
            Precio durante el beta
          </p>
          <p className="mb-2 text-5xl font-black sm:text-6xl" style={{ color: 'var(--text)' }}>
            Gratis
          </p>
          <p className="mx-auto max-w-md text-base" style={{ color: 'var(--muted)' }}>
            Mientras validamos con los primeros 5 negocios, todo es sin costo. Sin comisiones por pedido, ni ahora ni después.
          </p>
        </div>
      </section>

      {/* Lead capture + Final CTA */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl" style={{ color: 'var(--text)' }}>
              ¿Tenés un negocio en Cuba?
            </h2>
            <p className="mb-6 text-lg" style={{ color: 'var(--muted)' }}>
              Estamos buscando 5 negocios para acompañar en el alta. Dejá tus datos y te escribimos.
              O si querés algo rápido, escribinos directo por Telegram.
            </p>
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-teal-violet shadow-glow inline-block rounded-xl px-6 py-3 font-semibold text-white hover:opacity-90"
            >
              Escribir por Telegram →
            </a>
          </div>
          <LeadForm source="landing" />
        </div>
      </section>

      {/* Footer (shared) */}
      <MarketingFooter />
    </main>
  )
}

const FEATURES = [
  {
    icon:  '📋',
    title: 'Catálogo público',
    body:  'Tus productos con foto, precio y stock en tu propio subdominio: turegocio.colacero.com',
  },
  {
    icon:  '🛒',
    title: 'Reservas de stock',
    body:  'Cada pedido reserva el inventario por unos minutos. No vendés lo que no tenés.',
  },
  {
    icon:  '💬',
    title: 'Auth por Telegram',
    body:  'Tus clientes entran con un clic desde Telegram. Sin contraseñas, sin OTP por SMS.',
  },
  {
    icon:  '🕐',
    title: 'Ventanas de recogida',
    body:  'Definí horarios y capacidad. El sistema rechaza pedidos cuando se llena la ventana.',
  },
  {
    icon:  '📊',
    title: 'Analytics reales',
    body:  'Dashboard con KPIs, top productos, co-compras y alertas de stock bajo.',
  },
  {
    icon:  '🔔',
    title: 'Notificaciones',
    body:  'Avisos automáticos cuando llegan pedidos, vía Telegram al grupo del negocio.',
  },
]

const STEPS = [
  {
    title: 'Te damos de alta',
    body:  'En una llamada de 30 min cargamos tu negocio, productos y horarios. No tenés que hacer nada solo.',
  },
  {
    title: 'Compartís el link',
    body:  'Le pasás tunegocio.colacero.com a tus clientes por Telegram, WhatsApp o el medio que uses.',
  },
  {
    title: 'Atendés los pedidos',
    body:  'Cuando entra un pedido, recibís notificación. Lo preparás, le pasás el código de recogida al cliente.',
  },
]
