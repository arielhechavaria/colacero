'use client'

import { motion } from 'framer-motion'

const DEMO_BIZ_URL = 'https://el-fogon.colacero.com'

// ── Variants ──────────────────────────────────────────────────────────────────

const container = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const EXPO_OUT = [0.19, 1, 0.22, 1] as [number, number, number, number]

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EXPO_OUT } },
}

const fadeIn = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
}

// ── Floating card wrapper ──────────────────────────────────────────────────────

function FloatCard({
  children,
  className,
  delay = 0,
  direction = 'up',
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down'
}) {
  const offset = direction === 'up' ? -10 : 10
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.19, 1, 0.22, 1] }}
    >
      <motion.div
        animate={{ y: [0, offset, 0] }}
        transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay: delay * 0.5 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-[#070D1B]">

      {/* Dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Gradient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-32 left-[5%] h-[700px] w-[700px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.22), transparent 65%)' }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-[5%] h-[600px] w-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.18), transparent 65%)' }}
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-[55%] left-[40%] h-[400px] w-[400px] rounded-full -translate-x-1/2"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 65%)' }}
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-20 sm:py-28 lg:py-36">
        <div className="grid gap-16 lg:grid-cols-2 lg:items-center">

          {/* ── Left: Text ── */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div variants={fadeUp}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Beta · Buscando 5 negocios cubanos
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={fadeUp}
              className="mb-6 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]"
            >
              Recibí pedidos
              <br />por Telegram.
              <br />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-teal-400 bg-clip-text text-transparent">
                Cero comisiones.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={fadeUp}
              className="mb-8 max-w-lg text-base text-slate-400 sm:text-lg leading-relaxed"
            >
              Tu negocio en línea con catálogo, reservas de stock y notificaciones a tus clientes — sin pagar por pedido, sin intermediarios.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
              <motion.a
                href="https://panel.colacero.com/signup"
                className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-500 via-violet-600 to-indigo-500 bg-[length:200%_100%] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/20"
                whileHover={{ scale: 1.02, backgroundPosition: '100% 0' }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                style={{ backgroundSize: '200% 100%', backgroundPosition: '0% 0' }}
              >
                Crear mi negocio →
              </motion.a>
              <motion.a
                href={DEMO_BIZ_URL}
                className="rounded-xl border border-white/10 bg-white/[0.06] px-7 py-3.5 text-base font-semibold text-slate-200 backdrop-blur-sm hover:bg-white/[0.10] hover:border-white/20 transition-all duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                Ver demo en vivo
              </motion.a>
            </motion.div>

            {/* Trust */}
            <motion.p variants={fadeIn} className="mt-5 text-xs text-slate-600">
              Gratis durante el beta · Sin tarjeta · Sin contratos
            </motion.p>
          </motion.div>

          {/* ── Right: Floating UI mockups ── */}
          <div className="relative hidden lg:block h-[560px]">

            {/* Main order card */}
            <FloatCard
              className="absolute top-4 left-0 right-8"
              delay={0.3}
              direction="up"
            >
              <div className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-5 shadow-2xl backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-base">🛒</div>
                    <div>
                      <p className="text-xs font-semibold text-white">Nuevo pedido</p>
                      <p className="text-[10px] text-slate-500">hace 2 min</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/20">
                    Por preparar
                  </span>
                </div>
                <div className="mb-3 rounded-xl bg-white/[0.04] p-3 border border-white/[0.06]">
                  <p className="text-xs font-semibold text-slate-300">Juan García <span className="font-mono text-indigo-400 ml-1">#A4K2</span></p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {['Arroz × 2lb', 'Frijoles negros', 'Aceite'].map(item => (
                      <span key={item} className="rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[10px] text-slate-400">{item}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-slate-600">⏰ Recogida: hoy 10:00 – 12:00</p>
                  <button className="rounded-lg bg-amber-500/20 border border-amber-500/20 px-2.5 py-1 text-[10px] font-semibold text-amber-400">Preparar →</button>
                </div>
              </div>
            </FloatCard>

            {/* Ready notification */}
            <FloatCard
              className="absolute bottom-28 right-0 w-56"
              delay={0.55}
              direction="down"
            >
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-300">Pedido listo</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-1">
                  Código: <span className="font-mono font-bold text-white tracking-wider">A4K2</span>
                </p>
                <p className="text-[10px] text-slate-600">Cliente notificado por Telegram ✓</p>
              </div>
            </FloatCard>

            {/* Mini analytics */}
            <FloatCard
              className="absolute bottom-0 left-4 w-64"
              delay={0.4}
              direction="up"
            >
              <div className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-4 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-slate-600">Ingresos hoy</p>
                    <p className="text-xl font-black text-white mt-0.5">$2,400</p>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 rounded-full px-2 py-0.5 border border-emerald-400/20">↑ 23%</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Cupos ocupados</span><span className="text-slate-400">12 / 30</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-400"
                      initial={{ width: 0 }}
                      animate={{ width: '40%' }}
                      transition={{ duration: 1.2, delay: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </div>
            </FloatCard>

            {/* Telegram notification */}
            <FloatCard
              className="absolute top-[44%] right-2 w-52"
              delay={0.7}
              direction="down"
            >
              <div className="rounded-2xl border border-white/[0.09] bg-[#1a1f35]/80 p-3.5 shadow-2xl backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#229ED9] text-xs font-bold text-white">✈</div>
                  <div>
                    <p className="text-[10px] font-semibold text-white">El Fogón · ColaCero</p>
                    <p className="text-[9px] text-slate-600">Telegram</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  🔔 Nuevo pedido de María López. <br/>
                  Arroz · Frijoles · <span className="text-indigo-400">#B7M9</span>
                </p>
              </div>
            </FloatCard>
          </div>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32"
        style={{ background: 'linear-gradient(to bottom, transparent, #070D1B)' }}
      />
    </section>
  )
}
