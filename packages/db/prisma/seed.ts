import { PrismaClient, OrderStatus } from '@prisma/client'
import { hash } from '@node-rs/argon2'

const prisma = new PrismaClient()

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pad(n: number): string {
  return n.toString().padStart(2, '0')
}

function genPickupCode(): string {
  // 6 caracteres alfanuméricos en mayúscula
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days)
  return d
}

function dateAtTime(base: Date, time: string): Date {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(base)
  d.setHours(h ?? 10, m ?? 0, 0, 0)
  return d
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// ─── Datasets ────────────────────────────────────────────────────────────────

const PRODUCTS = [
  // Carnes
  { sku: 'POLLO-01',    name: 'Pollo entero',     category: 'Carnes',    unitPrice: 350, unitLabel: 'lb',     qty: 50,  threshold: 8,  description: 'Pollo fresco del día, sin hormonas' },
  { sku: 'CERDO-01',    name: 'Cerdo en piezas',  category: 'Carnes',    unitPrice: 280, unitLabel: 'lb',     qty: 30,  threshold: 5,  description: 'Cerdo de campo criado naturalmente' },
  { sku: 'RES-01',      name: 'Carne de res',     category: 'Carnes',    unitPrice: 420, unitLabel: 'lb',     qty: 20,  threshold: 5,  description: 'Res criolla, corte de primera' },
  // Granos
  { sku: 'ARROZ-01',    name: 'Arroz',            category: 'Granos',    unitPrice: 45,  unitLabel: 'libra',  qty: 200, threshold: 20, description: 'Arroz blanco grano largo, 1ra calidad' },
  { sku: 'FRIJOL-01',   name: 'Frijoles negros',  category: 'Granos',    unitPrice: 60,  unitLabel: 'libra',  qty: 150, threshold: 15, description: 'Frijoles negros cubanos seleccionados' },
  { sku: 'LENTEJA-01',  name: 'Lentejas',         category: 'Granos',    unitPrice: 80,  unitLabel: 'libra',  qty: 60,  threshold: 10, description: 'Lentejas pardinas, ricas en hierro' },
  // Lácteos
  { sku: 'LECHE-01',    name: 'Leche entera',     category: 'Lácteos',   unitPrice: 180, unitLabel: 'litro',  qty: 40,  threshold: 8,  description: 'Leche pasteurizada del día' },
  { sku: 'QUESO-01',    name: 'Queso blanco',     category: 'Lácteos',   unitPrice: 250, unitLabel: 'lb',     qty: 25,  threshold: 5,  description: 'Queso blanco artesanal' },
  { sku: 'HUEVOS-01',   name: 'Huevos',           category: 'Lácteos',   unitPrice: 35,  unitLabel: 'unidad', qty: 4,   threshold: 30, description: 'Huevos frescos de gallinas de campo' }, // bajo stock intencional
  // Frutas
  { sku: 'MANGO-01',    name: 'Mango',            category: 'Frutas',    unitPrice: 25,  unitLabel: 'unidad', qty: 80,  threshold: 15, description: 'Mango maduro de temporada' },
  { sku: 'PLATANO-01',  name: 'Plátano',          category: 'Frutas',    unitPrice: 15,  unitLabel: 'unidad', qty: 120, threshold: 20, description: 'Plátano fruta, dulce y maduro' },
  { sku: 'AGUACATE-01', name: 'Aguacate',         category: 'Frutas',    unitPrice: 60,  unitLabel: 'unidad', qty: 35,  threshold: 8,  description: 'Aguacate criollo cremoso' },
  // Vegetales
  { sku: 'CEBOLLA-01',  name: 'Cebolla',          category: 'Vegetales', unitPrice: 40,  unitLabel: 'libra',  qty: 70,  threshold: 10, description: 'Cebolla blanca de la finca' },
  { sku: 'TOMATE-01',   name: 'Tomate',           category: 'Vegetales', unitPrice: 30,  unitLabel: 'libra',  qty: 90,  threshold: 12, description: 'Tomate maduro de huerto local' },
  { sku: 'AJO-01',      name: 'Ajo',              category: 'Vegetales', unitPrice: 120, unitLabel: 'libra',  qty: 15,  threshold: 5,  description: 'Ajo morado curado al sol' },
  // Almacén
  { sku: 'ACEITE-01',   name: 'Aceite',           category: 'Almacén',   unitPrice: 600, unitLabel: 'litro',  qty: 40,  threshold: 8,  description: 'Aceite vegetal embotellado' },
  { sku: 'AZUCAR-01',   name: 'Azúcar',           category: 'Almacén',   unitPrice: 50,  unitLabel: 'libra',  qty: 100, threshold: 15, description: 'Azúcar blanca refinada' },
  { sku: 'PAN-01',      name: 'Pan suave',        category: 'Almacén',   unitPrice: 20,  unitLabel: 'unidad', qty: 60,  threshold: 12, description: 'Pan suave horneado en el día' },
] as const

const CUSTOMERS = [
  { telegramId: '11111001', displayName: 'Yusniel Pérez' },
  { telegramId: '11111002', displayName: 'Daimara Cruz' },
  { telegramId: '11111003', displayName: 'Yaniel Romero' },
  { telegramId: '11111004', displayName: 'Lisandra Méndez' },
  { telegramId: '11111005', displayName: 'Reinier Acosta' },
  { telegramId: '11111006', displayName: 'Yanelys Domínguez' },
  { telegramId: '11111007', displayName: 'Lázaro Sosa' },
  { telegramId: '11111008', displayName: 'Yamila Iglesias' },
] as const

const PICKUP_WINDOW_TIMES = [
  { startTime: '10:00', endTime: '12:00', capacity: 10 },
  { startTime: '15:00', endTime: '17:00', capacity: 10 },
] as const

// Co-purchases armados a propósito para que el dashboard analytics muestre algo
// Cada entrada: días atrás (0 = hoy), SKUs forzados, extras random adicionales, status, notas opcionales
type SeedOrder = {
  daysAgo: number
  windowIdx: 0 | 1
  forceSkus: string[]
  extras: number  // productos random extra
  customerIdx: number
  status: OrderStatus
  notes?: string
}

const HISTORIC_ORDERS: SeedOrder[] = [
  // Co-purchase: Arroz + Frijoles negros (8 veces)
  { daysAgo: 28, windowIdx: 0, forceSkus: ['ARROZ-01', 'FRIJOL-01'], extras: 1, customerIdx: 0, status: 'PICKED_UP' },
  { daysAgo: 25, windowIdx: 1, forceSkus: ['ARROZ-01', 'FRIJOL-01'], extras: 1, customerIdx: 1, status: 'PICKED_UP' },
  { daysAgo: 22, windowIdx: 0, forceSkus: ['ARROZ-01', 'FRIJOL-01'], extras: 0, customerIdx: 2, status: 'PICKED_UP' },
  { daysAgo: 19, windowIdx: 1, forceSkus: ['ARROZ-01', 'FRIJOL-01'], extras: 2, customerIdx: 3, status: 'PICKED_UP' },
  { daysAgo: 14, windowIdx: 0, forceSkus: ['ARROZ-01', 'FRIJOL-01'], extras: 1, customerIdx: 4, status: 'PICKED_UP' },
  { daysAgo: 10, windowIdx: 1, forceSkus: ['ARROZ-01', 'FRIJOL-01'], extras: 1, customerIdx: 0, status: 'PICKED_UP' },
  { daysAgo: 6,  windowIdx: 0, forceSkus: ['ARROZ-01', 'FRIJOL-01'], extras: 0, customerIdx: 5, status: 'PICKED_UP', notes: 'Por favor en bolsa de tela' },
  { daysAgo: 3,  windowIdx: 1, forceSkus: ['ARROZ-01', 'FRIJOL-01'], extras: 1, customerIdx: 6, status: 'PICKED_UP' },

  // Co-purchase: Pollo + Aceite (6 veces)
  { daysAgo: 26, windowIdx: 0, forceSkus: ['POLLO-01', 'ACEITE-01'], extras: 1, customerIdx: 1, status: 'PICKED_UP' },
  { daysAgo: 21, windowIdx: 1, forceSkus: ['POLLO-01', 'ACEITE-01'], extras: 0, customerIdx: 2, status: 'PICKED_UP' },
  { daysAgo: 17, windowIdx: 0, forceSkus: ['POLLO-01', 'ACEITE-01'], extras: 2, customerIdx: 5, status: 'PICKED_UP' },
  { daysAgo: 12, windowIdx: 1, forceSkus: ['POLLO-01', 'ACEITE-01'], extras: 1, customerIdx: 7, status: 'PICKED_UP' },
  { daysAgo: 7,  windowIdx: 0, forceSkus: ['POLLO-01', 'ACEITE-01'], extras: 1, customerIdx: 3, status: 'PICKED_UP', notes: 'Sin grasa por favor' },
  { daysAgo: 2,  windowIdx: 1, forceSkus: ['POLLO-01', 'ACEITE-01'], extras: 0, customerIdx: 4, status: 'PICKED_UP' },

  // Co-purchase: Pan + Huevos (4 veces)
  { daysAgo: 23, windowIdx: 0, forceSkus: ['PAN-01', 'HUEVOS-01'], extras: 0, customerIdx: 0, status: 'PICKED_UP' },
  { daysAgo: 16, windowIdx: 1, forceSkus: ['PAN-01', 'HUEVOS-01'], extras: 1, customerIdx: 4, status: 'PICKED_UP' },
  { daysAgo: 9,  windowIdx: 0, forceSkus: ['PAN-01', 'HUEVOS-01'], extras: 0, customerIdx: 7, status: 'PICKED_UP' },
  { daysAgo: 4,  windowIdx: 1, forceSkus: ['PAN-01', 'HUEVOS-01'], extras: 1, customerIdx: 6, status: 'PICKED_UP' },

  // Random históricas (8 más para llegar a 26)
  { daysAgo: 27, windowIdx: 0, forceSkus: ['QUESO-01'], extras: 2, customerIdx: 6, status: 'PICKED_UP' },
  { daysAgo: 20, windowIdx: 1, forceSkus: ['MANGO-01', 'PLATANO-01'], extras: 1, customerIdx: 7, status: 'PICKED_UP' },
  { daysAgo: 18, windowIdx: 0, forceSkus: ['CERDO-01'], extras: 2, customerIdx: 0, status: 'PICKED_UP' },
  { daysAgo: 13, windowIdx: 1, forceSkus: ['LECHE-01', 'PAN-01'], extras: 1, customerIdx: 2, status: 'PICKED_UP', notes: 'Para celíaco si es posible' },
  { daysAgo: 11, windowIdx: 0, forceSkus: ['TOMATE-01', 'CEBOLLA-01'], extras: 1, customerIdx: 5, status: 'CANCELLED' },
  { daysAgo: 8,  windowIdx: 1, forceSkus: ['RES-01'], extras: 2, customerIdx: 1, status: 'PICKED_UP' },
  { daysAgo: 5,  windowIdx: 0, forceSkus: ['AGUACATE-01', 'TOMATE-01'], extras: 1, customerIdx: 3, status: 'PICKED_UP' },
  { daysAgo: 1,  windowIdx: 1, forceSkus: ['AZUCAR-01', 'LECHE-01'], extras: 1, customerIdx: 6, status: 'CANCELLED', notes: 'Cliente no respondió a confirmación' },

  // Hoy — kanban activo (6 órdenes en distintos estados)
  { daysAgo: 0, windowIdx: 0, forceSkus: ['ARROZ-01', 'FRIJOL-01', 'POLLO-01'], extras: 0, customerIdx: 0, status: 'CONFIRMED', notes: 'Por favor en bolsa de tela' },
  { daysAgo: 0, windowIdx: 0, forceSkus: ['CERDO-01', 'CEBOLLA-01'], extras: 1, customerIdx: 1, status: 'PREPARING' },
  { daysAgo: 0, windowIdx: 0, forceSkus: ['HUEVOS-01', 'PAN-01'], extras: 0, customerIdx: 2, status: 'READY' },
  { daysAgo: 0, windowIdx: 1, forceSkus: ['MANGO-01', 'PLATANO-01', 'AGUACATE-01'], extras: 0, customerIdx: 3, status: 'CONFIRMED' },
  { daysAgo: 0, windowIdx: 1, forceSkus: ['ACEITE-01', 'ARROZ-01'], extras: 1, customerIdx: 4, status: 'READY' },
  { daysAgo: 0, windowIdx: 1, forceSkus: ['QUESO-01', 'PAN-01'], extras: 1, customerIdx: 5, status: 'PREPARING', notes: 'Sin lactosa si tienen' },
]

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding ColaCero — full demo dataset...\n')

  // 1. Negocio piloto
  const business = await prisma.business.upsert({
    where:  { slug: 'el-fogon' },
    update: {
      name:        'El Fogón',
      description: 'Reparto de alimentos frescos diarios',
    },
    create: {
      slug:        'el-fogon',
      name:        'El Fogón',
      description: 'Reparto de alimentos frescos diarios',
      timezone:    'America/Havana',
    },
  })
  console.log(`✓ Business: ${business.name} (${business.slug})`)

  // 2. Owner
  const ownerHash = await hash('test1234')
  const owner = await prisma.user.upsert({
    where:  { businessId_email: { businessId: business.id, email: 'ariel@elfogon.cu' } },
    update: { passwordHash: ownerHash },
    create: {
      businessId:   business.id,
      email:        'ariel@elfogon.cu',
      passwordHash: ownerHash,
      role:         'OWNER',
    },
  })
  console.log(`✓ Owner: ${owner.email} (password: test1234)`)

  // 3. LIMPIEZA — borrar todo lo dependiente del business para reseed limpio
  // Orden por dependencias: Notification → OrderItem → Order → PickupWindow
  console.log('\n🧹 Limpiando órdenes y ventanas previas del business...')
  const ordersToDelete = await prisma.order.findMany({
    where:  { businessId: business.id },
    select: { id: true },
  })
  const orderIds = ordersToDelete.map((o) => o.id)
  if (orderIds.length > 0) {
    await prisma.notification.deleteMany({ where: { orderId: { in: orderIds } } })
    await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } })
    console.log(`  ✓ ${orderIds.length} órdenes (+ items y notifs) eliminadas`)
  }
  await prisma.pickupWindow.deleteMany({ where: { businessId: business.id } })
  console.log('  ✓ Pickup windows eliminadas')

  // 4. Productos (upsert por businessId+sku)
  console.log('\n📦 Productos:')
  const productMap = new Map<string, { id: string; unitPrice: number }>()
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { businessId_sku: { businessId: business.id, sku: p.sku } },
      update: {
        name:        p.name,
        description: p.description,
        unitPrice:   p.unitPrice,
        unitLabel:   p.unitLabel,
        category:    p.category,
        isActive:    true,
      },
      create: {
        businessId:  business.id,
        sku:         p.sku,
        name:        p.name,
        description: p.description,
        unitPrice:   p.unitPrice,
        unitLabel:   p.unitLabel,
        category:    p.category,
        isActive:    true,
      },
    })
    await prisma.inventory.upsert({
      where:  { productId: product.id },
      update: { quantityAvailable: p.qty, lowStockThreshold: p.threshold },
      create: {
        productId:         product.id,
        quantityAvailable: p.qty,
        lowStockThreshold: p.threshold,
      },
    })
    productMap.set(p.sku, { id: product.id, unitPrice: p.unitPrice })
    console.log(`  ✓ [${p.category}] ${p.name} — $${p.unitPrice}/${p.unitLabel} · stock ${p.qty}`)
  }

  // 5. Customers (upsert por telegramId)
  console.log('\n👥 Customers:')
  const customerMap = new Map<number, { id: string }>()
  for (let i = 0; i < CUSTOMERS.length; i++) {
    const c = CUSTOMERS[i]!
    const customer = await prisma.customer.upsert({
      where:  { telegramId: c.telegramId },
      update: { displayName: c.displayName, lastLoginAt: new Date() },
      create: {
        telegramId:  c.telegramId,
        displayName: c.displayName,
        lastLoginAt: new Date(),
      },
    })
    customerMap.set(i, { id: customer.id })
    console.log(`  ✓ ${c.displayName} (${c.telegramId})`)
  }

  // 6. Pickup windows — últimos 30 días + hoy + mañana
  console.log('\n🗓  Pickup windows:')
  // Mapa: "daysAgo:windowIdx" → windowId
  const windowMap = new Map<string, string>()
  for (let d = 30; d >= -1; d--) {
    const date = daysAgo(d)
    for (let wIdx = 0; wIdx < PICKUP_WINDOW_TIMES.length; wIdx++) {
      const w = PICKUP_WINDOW_TIMES[wIdx]!
      const created = await prisma.pickupWindow.create({
        data: {
          businessId: business.id,
          date,
          startTime:  w.startTime,
          endTime:    w.endTime,
          capacity:   w.capacity,
          isOpen:     d >= -1, // todas abiertas (incluido mañana)
        },
      })
      windowMap.set(`${d}:${wIdx}`, created.id)
    }
  }
  console.log(`  ✓ ${windowMap.size} ventanas creadas (30 días pasados + hoy + mañana)`)

  // 7. Órdenes históricas y de hoy
  console.log('\n📋 Órdenes:')
  let ordersCreated = 0
  for (const o of HISTORIC_ORDERS) {
    const customer = customerMap.get(o.customerIdx)
    if (!customer) continue
    const windowId = windowMap.get(`${o.daysAgo}:${o.windowIdx}`)
    if (!windowId) {
      console.warn(`  ⚠ Sin window para daysAgo=${o.daysAgo} idx=${o.windowIdx}`)
      continue
    }

    // Construir items: forced + extras random (sin duplicados)
    const forcedSkus = new Set(o.forceSkus)
    const candidateSkus = PRODUCTS.map((p) => p.sku).filter((s) => !forcedSkus.has(s))
    const extraSkus = pickN(candidateSkus, o.extras)
    const allSkus = [...o.forceSkus, ...extraSkus]

    const itemsData = allSkus.map((sku) => {
      const p = productMap.get(sku)!
      const qty = randInt(1, 3)
      return {
        productId:         p.id,
        quantity:          qty,
        unitPriceSnapshot: p.unitPrice,
        subtotal:          p.unitPrice * qty,
      }
    })

    const subtotal = itemsData.reduce((acc, it) => acc + it.subtotal, 0)

    // Timestamps según status
    const baseDate = daysAgo(o.daysAgo)
    const window = PICKUP_WINDOW_TIMES[o.windowIdx]!
    const windowStart = dateAtTime(baseDate, window.startTime)
    const createdAt = new Date(windowStart.getTime() - 60 * 60 * 1000) // 1h antes

    let confirmedAt: Date | null = null
    let readyAt: Date | null = null
    let pickedUpAt: Date | null = null
    let pickupCode: string | null = null

    if (o.status !== 'DRAFT' && o.status !== 'CANCELLED') {
      confirmedAt = createdAt
      pickupCode = genPickupCode()
    }
    if (o.status === 'READY' || o.status === 'PICKED_UP') {
      readyAt = new Date(windowStart.getTime() - 5 * 60 * 1000) // 5min antes del start
    }
    if (o.status === 'PICKED_UP') {
      pickedUpAt = new Date(windowStart.getTime() + randInt(10, 100) * 60 * 1000)
    }
    if (o.status === 'CANCELLED') {
      // sin pickupCode
    }

    await prisma.order.create({
      data: {
        businessId:     business.id,
        customerId:     customer.id,
        pickupWindowId: windowId,
        status:         o.status,
        subtotal,
        pickupCode,
        notes:          o.notes ?? null,
        createdAt,
        confirmedAt,
        readyAt,
        pickedUpAt,
        items: { create: itemsData },
      },
    })

    // Incrementar ordersCount de la ventana si la orden cuenta (no CANCELLED)
    if (o.status !== 'CANCELLED' && o.status !== 'DRAFT' && o.status !== 'EXPIRED') {
      await prisma.pickupWindow.update({
        where: { id: windowId },
        data:  { ordersCount: { increment: 1 } },
      })
    }

    ordersCreated++
  }
  console.log(`  ✓ ${ordersCreated} órdenes creadas (mix de PICKED_UP / READY / CONFIRMED / PREPARING / CANCELLED)`)

  // 8. Resumen
  console.log('\n🎉 Seed completado!\n')
  console.log('Resumen:')
  console.log(`  • Business:       ${business.name}`)
  console.log(`  • Owner:          ariel@elfogon.cu / test1234`)
  console.log(`  • Productos:      ${PRODUCTS.length} en 6 categorías`)
  console.log(`  • Customers:      ${CUSTOMERS.length}`)
  console.log(`  • Ventanas:       ${windowMap.size}`)
  console.log(`  • Órdenes:        ${ordersCreated}`)
  console.log(`  • Co-purchases:   Arroz+Frijoles (8) · Pollo+Aceite (6) · Pan+Huevos (4)`)
  console.log(`  • Stock alert:    Huevos (4 unidades, threshold 30)`)
}

main()
  .catch((err) => {
    console.error('❌ Seed falló:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
