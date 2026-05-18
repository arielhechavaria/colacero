import type { Metadata } from 'next'
import Link from 'next/link'
import { MarketingShell } from '../../components/marketing-shell'

export const metadata: Metadata = {
  title:       'Preguntas frecuentes',
  description: 'Respuestas a las dudas más comunes sobre ColaCero',
}

const CONTACT_URL = process.env['NEXT_PUBLIC_CONTACT_URL'] ?? 'https://t.me/Arielhechavarria'

const FAQS = [
  {
    q: '¿Mis clientes necesitan tener Telegram para pedir?',
    a: 'Recomendamos Telegram porque la auth es de un clic (sin OTP por SMS, que en Cuba es caro y lento). Pero también ofrecemos un fallback por OTP por teléfono para clientes sin Telegram.',
  },
  {
    q: '¿ColaCero procesa pagos?',
    a: 'No. Vos arreglás el pago con el cliente como ya lo hacés (efectivo al recoger, transferencia previa, link de pago de un tercero, etc.). Nosotros nos ocupamos del catálogo, las reservas y la coordinación de la entrega.',
  },
  {
    q: '¿Hay comisión por pedido?',
    a: 'No. Pagás un plan fijo mensual (gratis durante el beta) y todo lo que vendés es 100% tuyo. Sin sorpresas.',
  },
  {
    q: '¿Qué pasa si me equivoco al cargar un producto?',
    a: 'Podés editar o eliminar cualquier producto en cualquier momento desde el panel. Si tiene pedidos asociados, te avisamos antes de borrarlo.',
  },
  {
    q: '¿Puede haber más de un usuario gestionando el panel?',
    a: 'Sí. En Configuración → Staff podés agregar miembros del equipo con rol OWNER (gestión completa) o STAFF (sin permisos administrativos).',
  },
  {
    q: '¿Qué pasa si quiero salir de ColaCero?',
    a: 'Cancelás cuando quieras, sin penalidades. Si necesitás exportar tus datos (productos, clientes, historial de pedidos), te los entregamos. Vos sos dueño de tu información.',
  },
  {
    q: '¿Cómo manejan el stock cuando dos clientes compran lo mismo a la vez?',
    a: 'Cada producto en el carrito reserva el stock por 5 minutos. Si el cliente no completa la compra en ese tiempo, vuelve a estar disponible. Esto evita vender lo que no tenés.',
  },
  {
    q: '¿Puedo conectar mi cuenta de Instagram, Facebook o WhatsApp Business?',
    a: 'Por ahora no tenemos integraciones directas, pero podés compartir el link de tu catálogo (turegocio.colacero.com) en bio de Instagram, WhatsApp Business, Telegram o donde quieras.',
  },
  {
    q: '¿Tienen app para celular?',
    a: 'No hace falta. El catálogo y el panel funcionan perfecto desde el navegador del celular. Es responsive y rápido.',
  },
  {
    q: '¿Funciona en Cuba con internet lento?',
    a: 'Sí. Hospedamos todo en infra optimizada y usamos Cloudflare para acelerar la carga. Los catálogos cachean para que abran rápido incluso con conexión intermitente.',
  },
  {
    q: '¿Cómo me doy de alta?',
    a: 'Por ahora hacemos el alta a mano para acompañarte. Escribinos por Telegram (link al final de esta página) y arrancamos en una llamada de 30 minutos.',
  },
]

export default function FaqPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
          Preguntas frecuentes
        </p>
        <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl" style={{ color: 'var(--text)' }}>
          Dudas comunes
        </h1>
        <p className="mb-12 text-lg" style={{ color: 'var(--muted)' }}>
          Si no encontrás tu pregunta acá, escribinos por Telegram. Te respondemos en el día.
        </p>

        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <details
              key={i}
              className="glass group rounded-2xl p-5 transition-all"
              style={{ border: '1px solid var(--glass-border)' }}
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 list-none">
                <h3 className="text-base font-semibold" style={{ color: 'var(--text)' }}>
                  {item.q}
                </h3>
                <span className="text-xl transition-transform group-open:rotate-45" style={{ color: 'var(--muted)' }}>+</span>
              </summary>
              <p className="mt-4 leading-relaxed" style={{ color: 'var(--muted)' }}>
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-16 rounded-3xl border p-8 text-center" style={{ borderColor: 'var(--glass-border)' }}>
          <h2 className="mb-3 text-xl font-bold" style={{ color: 'var(--text)' }}>
            ¿Otra pregunta?
          </h2>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            Escribinos por Telegram y te respondemos en el día.
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

        <p className="mt-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
          ¿Buscás cómo usar la plataforma? Mirá el{' '}
          <Link href="/manual" className="underline" style={{ color: 'var(--text)' }}>manual completo</Link>.
        </p>
      </div>
    </MarketingShell>
  )
}
