'use client'

import { motion } from 'framer-motion'

// ── Shared variants ────────────────────────────────────────────────────────────

const EXPO_OUT = [0.19, 1, 0.22, 1] as [number, number, number, number]

const inView = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EXPO_OUT } },
}

const stagger = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09 } },
}

const viewportOptions = { once: true, margin: '-80px' }

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-indigo-400">
      {children}
    </p>
  )
}

// ── FEATURES ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '📋',
    title: 'Catálogo público',
    body: 'Tus productos con foto, precio y stock en tu propio subdominio: tunegocio.colacero.com',
    accent: 'indigo',
  },
  {
    icon: '🔒',
    title: 'Reservas de stock',
    body: 'Cada pedido reserva el inventario al instante. No vendés lo que no tenés.',
    accent: 'violet',
  },
  {
    icon: '✈️',
    title: 'Auth por Telegram',
    body: 'Tus clientes entran con 1 tap desde Telegram. Sin contraseñas, sin OTP por SMS.',
    accent: 'teal',
  },
  {
    icon: '🕐',
    title: 'Ventanas de recogida',
    body: 'Definí horarios y capacidad. El sistema rechaza pedidos cuando se llena la ventana.',
    accent: 'indigo',
  },
  {
    icon: '📊',
    title: 'Analytics reales',
    body: 'Dashboard con KPIs, top productos, co-compras detectadas y alertas de stock bajo.',
    accent: 'violet',
  },
  {
    icon: '🔔',
    title: 'Notificaciones automáticas',
    body: 'Avisás a tus clientes cuando el pedido está listo — por Telegram, sin esfuerzo.',
    accent: 'teal',
  },
]

const accentMap: Record<string, { bg: string; border: string; icon: string }> = {
  indigo: { bg: 'bg-indigo-500/10',  border: 'hover:border-indigo-500/40', icon: 'bg-indigo-500/15 text-indigo-400' },
  violet: { bg: 'bg-violet-500/10',  border: 'hover:border-violet-500/40', icon: 'bg-violet-500/15 text-violet-400' },
  teal:   { bg: 'bg-teal-500/10',    border: 'hover:border-teal-500/40',   icon: 'bg-teal-500/15 text-teal-400'   },
}

export function LandingFeatures() {
  return (
    <section className="relative bg-[#070D1B] px-6 pb-24 pt-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-14 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={inView}
        >
          <SectionLabel>Todo incluido</SectionLabel>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Todo lo que necesitás,<br className="hidden sm:block" /> listo el primer día
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Una plataforma diseñada para la realidad de los negocios cubanos.
          </p>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={stagger}
        >
          {FEATURES.map((f) => {
            const a = accentMap[f.accent]!
            return (
              <motion.div
                key={f.title}
                variants={inView}
                className={`group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-all duration-300 ${a.border} hover:bg-white/[0.06] cursor-default`}
              >
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl text-xl ${a.icon}`}>
                  {f.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-white">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.body}</p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

// ── HOW IT WORKS ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    num: '01',
    title: 'Te damos de alta',
    body: 'En una llamada de 30 min cargamos tu negocio, productos y horarios. No tenés que hacer nada solo.',
    detail: 'Subdominio propio · Catálogo listo · Panel configurado',
    icon: '🚀',
  },
  {
    num: '02',
    title: 'Compartís el link',
    body: 'Le pasás tunegocio.colacero.com a tus clientes por Telegram, WhatsApp o como quieras.',
    detail: 'Link corto · Mini App opcional · QR descargable',
    icon: '🔗',
  },
  {
    num: '03',
    title: 'Atendés los pedidos',
    body: 'Cuando entra un pedido recibís notificación en Telegram. Lo preparás y el cliente recoge con su código.',
    detail: 'Notificación al instante · Código de recogida · Panel kanban',
    icon: '✅',
  },
]

export function LandingSteps() {
  return (
    <section className="relative overflow-hidden bg-[#070D1B] px-6 pb-24">
      {/* Subtle divider glow */}
      <div
        aria-hidden
        className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-[600px] opacity-30"
        style={{ background: 'linear-gradient(to right, transparent, #6366F1, #14B8A6, transparent)' }}
      />

      <div className="mx-auto max-w-6xl pt-16">
        <motion.div
          className="mb-16 text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewportOptions}
          variants={inView}
        >
          <SectionLabel>Sin complicaciones</SectionLabel>
          <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            Tres pasos.<br className="hidden sm:block" /> Del cero al primer pedido.
          </h2>
        </motion.div>

        <div className="relative">
          {/* Connecting line (desktop) */}
          <div
            aria-hidden
            className="absolute top-10 left-[calc(16.67%+20px)] right-[calc(16.67%+20px)] hidden h-px lg:block"
            style={{
              background: 'linear-gradient(to right, rgba(99,102,241,0.3), rgba(20,184,166,0.3))',
            }}
          />

          <motion.div
            className="grid gap-8 sm:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={viewportOptions}
            variants={stagger}
          >
            {STEPS.map((s) => (
              <motion.div key={s.num} variants={inView} className="flex flex-col items-center text-center">
                {/* Number circle */}
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/20 to-violet-600/20">
                  <span className="text-2xl font-black text-white">{s.num}</span>
                  <div
                    className="absolute inset-0 rounded-2xl"
                    style={{ boxShadow: '0 0 30px rgba(99,102,241,0.15)' }}
                  />
                </div>
                {/* Text */}
                <h3 className="mb-2 text-lg font-bold text-white">{s.title}</h3>
                <p className="mb-3 text-sm leading-relaxed text-slate-500 max-w-xs">{s.body}</p>
                <p className="text-[11px] text-indigo-400/70 font-medium">{s.detail}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ── STATS BAR ─────────────────────────────────────────────────────────────────

const STATS = [
  { value: '$0',   label: 'Comisión por pedido' },
  { value: '∞',    label: 'Productos en catálogo' },
  { value: '30m',  label: 'Alta inicial estimada' },
  { value: '100%', label: 'Tuyo, sin intermediarios' },
]

export function LandingStats() {
  return (
    <section className="relative border-y border-white/[0.06] bg-white/[0.02] px-6 py-12">
      <motion.div
        className="mx-auto grid max-w-4xl grid-cols-2 gap-8 sm:grid-cols-4"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOptions}
        variants={stagger}
      >
        {STATS.map((s) => (
          <motion.div key={s.label} variants={inView} className="text-center">
            <p className="text-3xl font-black text-white sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-xs text-slate-500 leading-tight">{s.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

// ── PRICING ───────────────────────────────────────────────────────────────────

const PERKS = [
  'Catálogo público con subdominio propio',
  'Panel de gestión completo',
  'Reservas de stock en tiempo real',
  'Notificaciones por Telegram',
  'Ventanas de recogida configurables',
  'Dashboard con analytics',
  'Generación de anuncios con IA',
  'Soporte durante el alta',
]

export function LandingPricing() {
  return (
    <section className="relative overflow-hidden bg-[#070D1B] px-6 pb-24 pt-16">
      <motion.div
        className="mx-auto max-w-lg text-center"
        initial="hidden"
        whileInView="visible"
        viewport={viewportOptions}
        variants={inView}
      >
        <SectionLabel>Precio del beta</SectionLabel>

        {/* Glowing pricing card */}
        <div className="relative mt-6 rounded-3xl p-[1px]"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.6), rgba(139,92,246,0.4), rgba(20,184,166,0.5))',
          }}
        >
          <div className="rounded-[23px] bg-[#0C1220] p-8 sm:p-12">
            <p className="text-7xl font-black text-white sm:text-8xl">Gratis</p>
            <p className="mt-3 text-slate-400">
              Mientras validamos con los primeros negocios, todo es sin costo.
              <br />
              <span className="font-medium text-slate-300">Sin comisiones por pedido, ni ahora ni después.</span>
            </p>

            <ul className="mt-8 space-y-3 text-left">
              {PERKS.map(p => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <span className="mt-0.5 flex-shrink-0 text-teal-400">✓</span>
                  {p}
                </li>
              ))}
            </ul>

            <motion.a
              href="https://panel.colacero.com/signup"
              className="mt-8 block rounded-xl bg-gradient-to-r from-indigo-500 via-violet-600 to-teal-500 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/20"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              Empezar ahora, es gratis →
            </motion.a>
            <p className="mt-3 text-[11px] text-slate-600">Sin tarjeta · Sin contratos · Cancelá cuando quieras</p>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
