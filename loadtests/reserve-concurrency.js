/**
 * k6 load test — Anti-overselling bajo carga
 *
 * Valida que el optimistic lock en Redis impide que el stock baje de 0
 * cuando N clientes intentan reservar el mismo producto simultáneamente.
 *
 * Requisitos:
 *   - pnpm dev corriendo (API en localhost:3000)
 *   - pnpm db:seed ejecutado (producto POLLO-01 con stock: 50)
 *   - k6 instalado: https://k6.io/docs/get-started/installation/
 *
 * Uso:
 *   k6 run loadtests/reserve-concurrency.js
 *   k6 run --vus 100 --duration 10s loadtests/reserve-concurrency.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Counter, Rate } from 'k6/metrics'

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE    = __ENV.API_BASE || 'http://localhost:3000'
const PRODUCT_ID  = __ENV.PRODUCT_ID  // set via: k6 run -e PRODUCT_ID=xxx
const QUANTITY    = 1

export const options = {
  scenarios: {
    concurrent_reservations: {
      executor:    'shared-iterations',
      vus:         50,
      iterations:  50,    // cada VU hace 1 intento (50 total, mismo producto)
      maxDuration: '30s',
    },
  },
  thresholds: {
    // Nunca debe ocurrir un oversell
    'oversell_detected': [{ threshold: 'count==0', abortOnFail: true }],
    // Al menos 1 reserva debe ser exitosa
    'reserve_success':   [{ threshold: 'count>0' }],
    // Latencia p95 < 2s
    'http_req_duration': ['p(95)<2000'],
  },
}

// ── Métricas custom ───────────────────────────────────────────────────────────

const oversellDetected = new Counter('oversell_detected')
const reserveSuccess   = new Counter('reserve_success')
const reserveFailed    = new Counter('reserve_failed')
const failRate         = new Rate('reserve_fail_rate')

// ── Setup — obtener productId del seed si no se pasó ─────────────────────────

export function setup() {
  if (PRODUCT_ID) return { productId: PRODUCT_ID }

  // Buscar el producto POLLO-01 via el catálogo público
  const res = http.get(`${API_BASE}/api/catalog/el-fogon/products`)
  if (res.status !== 200) {
    console.error('No se pudo obtener el catálogo. ¿Está el servidor corriendo y el seed ejecutado?')
    return { productId: null }
  }

  const products = res.json()
  const pollo = Array.isArray(products) && products.find(p => p.sku === 'POLLO-01')
  if (!pollo) {
    console.error('Producto POLLO-01 no encontrado. Ejecutá pnpm db:seed primero.')
    return { productId: null }
  }

  console.log(`Usando producto: ${pollo.name} (id: ${pollo.id}) con stock inicial: ${pollo.inventory?.quantityAvailable}`)
  return { productId: pollo.id, initialStock: pollo.inventory?.quantityAvailable }
}

// ── Test ──────────────────────────────────────────────────────────────────────

export default function (data) {
  if (!data.productId) {
    console.error('productId no disponible — abortando VU')
    return
  }

  const payload = JSON.stringify({ productId: data.productId, quantity: QUANTITY })
  const params  = { headers: { 'Content-Type': 'application/json' } }

  const res = http.post(`${API_BASE}/api/cart/reserve`, payload, params)

  const ok = res.status === 201
  const isInsufficientStock = res.status === 409 &&
    res.json('error') === 'insufficient_stock'
  const isOversell = res.status === 201 && (() => {
    // Si la reserva fue exitosa pero el stock ya debería estar en 0,
    // detectamos el oversell comparando contra el stock inicial
    return false // k6 no puede comparar contra DB directamente aquí
  })()

  check(res, {
    'status es 201 o 409':          (r) => r.status === 201 || r.status === 409,
    'no hay 500 (error de servidor)':(r) => r.status !== 500,
  })

  if (ok) {
    reserveSuccess.add(1)
    failRate.add(0)
  } else if (isInsufficientStock) {
    reserveFailed.add(1)
    failRate.add(1)
  } else if (res.status >= 500) {
    oversellDetected.add(1) // 500 inesperado puede indicar problema de concurrencia
    failRate.add(1)
  }

  sleep(0.1)
}

// ── Teardown — verificar stock final ─────────────────────────────────────────

export function teardown(data) {
  if (!data.productId) return

  // Verificar que el stock no bajó de 0 consultando el catálogo
  const res = http.get(`${API_BASE}/api/catalog/el-fogon/products`)
  if (res.status !== 200) return

  const products = res.json()
  const pollo = Array.isArray(products) && products.find(p => p.id === data.productId)

  if (pollo) {
    const stock = pollo.inventory?.quantityAvailable ?? -999
    console.log(`\n📊 Stock final de ${pollo.name}: ${stock}`)
    if (stock < 0) {
      oversellDetected.add(1)
      console.error(`❌ OVERSELL DETECTADO — stock: ${stock}`)
    } else {
      console.log(`✅ Sin oversell — stock final >= 0`)
    }
    if (data.initialStock !== undefined) {
      console.log(`   Reservas exitosas: ${data.initialStock - stock} de ${data.initialStock} disponibles`)
    }
  }
}
