import type { Metadata } from 'next'
import { MarketingShell } from '../../components/marketing-shell'
import { LeadForm } from '../../components/lead-form'

export const metadata: Metadata = {
  title:       'Contacto',
  description: 'Dejá tus datos y te escribimos para mostrarte ColaCero',
}

const CONTACT_URL = process.env['NEXT_PUBLIC_CONTACT_URL'] ?? 'https://t.me/Arielhechavarria'

export default function ContactoPage() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-5xl px-6 py-16">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--primary)' }}>
          Contacto
        </p>
        <h1 className="mb-4 text-4xl font-black tracking-tight sm:text-5xl" style={{ color: 'var(--text)' }}>
          Hablemos
        </h1>
        <p className="mb-12 max-w-2xl text-lg" style={{ color: 'var(--muted)' }}>
          Te respondemos en el día. Si preferís dejar tus datos y que nosotros te escribamos, usá el form.
          Si querés hablar ya mismo, escribinos por Telegram.
        </p>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Form */}
          <div>
            <h2 className="mb-4 text-xl font-bold" style={{ color: 'var(--text)' }}>
              Dejanos tus datos
            </h2>
            <LeadForm />
          </div>

          {/* Direct contact */}
          <div>
            <h2 className="mb-4 text-xl font-bold" style={{ color: 'var(--text)' }}>
              O escribinos directo
            </h2>
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="glass block rounded-2xl p-6 transition-all hover:opacity-90"
              style={{ border: '1px solid var(--glass-border)' }}
            >
              <div className="mb-2 flex items-center gap-3">
                <span className="text-2xl">💬</span>
                <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>Telegram</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                @Arielhechavarria
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--muted)' }}>
                La forma más rápida. Respondo en horario laboral cubano.
              </p>
            </a>

            <div className="mt-6 rounded-2xl border p-5 text-sm" style={{ borderColor: 'var(--glass-border)', color: 'var(--muted)' }}>
              <p className="mb-2 font-semibold" style={{ color: 'var(--text)' }}>💡 Antes de escribir:</p>
              <ul className="space-y-1 list-disc ml-5">
                <li>Si querés ver cómo funciona, mirá el <a href="https://el-fogon.colacero.com" className="underline">demo en vivo</a></li>
                <li>Si tenés dudas de cómo se usa, revisá el <a href="/manual" className="underline">manual</a></li>
                <li>Si querés saber cuánto cuesta, vení a <a href="/precios" className="underline">Precios</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  )
}
