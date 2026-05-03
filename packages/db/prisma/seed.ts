import { PrismaClient } from '@prisma/client'
import { hash } from '@node-rs/argon2'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding ColaCero...')

  // 1. Negocio piloto
  const business = await prisma.business.upsert({
    where: { slug: 'el-fogon' },
    update: {},
    create: {
      slug:        'el-fogon',
      name:        'El Fogón',
      description: 'Reparto de alimentos frescos diarios',
      timezone:    'America/Havana',
    },
  })
  console.log(`  ✓ Business: ${business.name} (${business.slug})`)

  // 2. Usuario owner
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
  console.log(`  ✓ Owner: ${owner.email}`)

  // 3. Productos con inventario
  const productos = [
    { sku: 'POLLO-01', name: 'Pollo',   unitPrice: 350, unitLabel: 'lb',    qty: 50 },
    { sku: 'CERDO-01', name: 'Cerdo',   unitPrice: 280, unitLabel: 'lb',    qty: 30 },
    { sku: 'ARROZ-01', name: 'Arroz',   unitPrice: 45,  unitLabel: 'libra', qty: 200 },
    { sku: 'ACEITE-01',name: 'Aceite',  unitPrice: 600, unitLabel: 'litro', qty: 40 },
    { sku: 'FRIJOL-01',name: 'Frijoles',unitPrice: 60,  unitLabel: 'libra', qty: 150 },
  ]

  for (const p of productos) {
    const product = await prisma.product.upsert({
      where: { businessId_sku: { businessId: business.id, sku: p.sku } },
      update: {},
      create: {
        businessId: business.id,
        sku:        p.sku,
        name:       p.name,
        unitPrice:  p.unitPrice,
        unitLabel:  p.unitLabel,
        isActive:   true,
      },
    })
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId:         product.id,
        quantityAvailable: p.qty,
        lowStockThreshold: 5,
      },
    })
    console.log(`  ✓ Producto: ${p.name} (stock: ${p.qty})`)
  }

  // 4. Ventanas de recogida para hoy (upsert por businessId+date+startTime)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Eliminar ventanas viejas del negocio para evitar acumulación
  await prisma.pickupWindow.deleteMany({
    where: { businessId: business.id },
  })

  const ventanas = [
    { startTime: '10:00', endTime: '12:00', capacity: 10 },
    { startTime: '15:00', endTime: '17:00', capacity: 10 },
  ]

  for (const v of ventanas) {
    await prisma.pickupWindow.create({
      data: {
        businessId: business.id,
        date:       today,
        startTime:  v.startTime,
        endTime:    v.endTime,
        capacity:   v.capacity,
        isOpen:     true,
      },
    })
    console.log(`  ✓ Ventana: ${v.startTime}–${v.endTime} (cap: ${v.capacity})`)
  }

  console.log('\n🎉 Seed completado!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
