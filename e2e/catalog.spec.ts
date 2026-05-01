import { test, expect } from '@playwright/test'
import { CATALOG_URL, BUSINESS_SLUG, TEST_PHONE, FAKE_CUSTOMER_JWT, FAKE_CUSTOMER } from './helpers'

const BASE = `${CATALOG_URL}/${BUSINESS_SLUG}`

test.describe('Catálogo — flujo cliente', () => {

  test('página del catálogo carga con productos', async ({ page }) => {
    await page.goto(BASE)
    await expect(page.getByRole('heading', { name: /el fogón/i })).toBeVisible()
    // Al menos un producto visible
    await expect(page.getByRole('button', { name: /agregar/i }).first()).toBeVisible()
  })

  test('agregar producto al carrito abre el drawer', async ({ page }) => {
    await page.goto(BASE)
    await page.getByRole('button', { name: /agregar/i }).first().click()
    // Drawer del carrito debe abrirse
    await expect(page.getByText(/tu pedido/i)).toBeVisible()
  })

  test('flujo checkout completo — con mock de OTP y reserve', async ({ page }) => {
    // Mock: reserva de stock
    await page.route('**/api/cart/reserve', route => {
      void route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ reservationId: 'test-reservation-01', expiresAt: new Date(Date.now() + 600_000).toISOString() }),
      })
    })

    // Mock: request-otp (siempre ok)
    await page.route('**/api/auth/customer/request-otp', route => {
      void route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
    })

    // Mock: verify-otp → devuelve JWT de prueba
    await page.route('**/api/auth/customer/verify-otp', route => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: FAKE_CUSTOMER_JWT, customer: FAKE_CUSTOMER }),
      })
    })

    // Mock: pickup-windows
    await page.route('**/api/catalog/**/pickup-windows', route => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'test-window-01',
          date: new Date().toISOString(),
          startTime: '10:00',
          endTime: '12:00',
          capacity: 10,
          ordersCount: 0,
          spotsLeft: 10,
        }]),
      })
    })

    // Mock: checkout
    await page.route('**/api/cart/checkout', route => {
      void route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          orderId:      'test-order-01',
          pickupCode:   'A7K2M9',
          subtotal:     350,
          items:        [{ productId: 'p1', name: 'Pollo', quantity: 1, unitPrice: 350, subtotal: 350 }],
          pickupWindow: { id: 'test-window-01', date: new Date().toISOString(), startTime: '10:00', endTime: '12:00' },
        }),
      })
    })

    // Mock: order detail (página confirmación)
    await page.route('**/api/cart/order/**', route => {
      void route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id:          'test-order-01',
          pickupCode:  'A7K2M9',
          status:      'CONFIRMED',
          subtotal:    350,
          confirmedAt: new Date().toISOString(),
          business:    { id: 'b1', name: 'El Fogón', slug: 'el-fogon' },
          pickupWindow: { id: 'test-window-01', date: new Date().toISOString(), startTime: '10:00', endTime: '12:00' },
          items:        [{ id: 'i1', productId: 'p1', name: 'Pollo', unitLabel: 'lb', quantity: 1, unitPriceSnapshot: 350, subtotal: 350 }],
        }),
      })
    })

    // ── Flujo ────────────────────────────────────────────────────────────────

    // 1. Catálogo → agregar al carrito
    await page.goto(BASE)
    await page.getByRole('button', { name: /agregar/i }).first().click()

    // 2. Drawer → confirmar pedido
    await page.getByRole('button', { name: /confirmar pedido/i }).click()

    // 3. Checkout paso 1 — formulario nombre + teléfono
    await page.waitForURL(`${BASE}/checkout`)
    await page.getByPlaceholder(/nombre/i).fill('Test Cliente')
    await page.getByPlaceholder(/teléfono/i).fill('70000001')
    await page.getByRole('button', { name: /enviar código/i }).click()

    // 4. Checkout paso 2 — OTP
    // Rellenar los 6 inputs del OTP
    const otpInputs = page.locator('input[inputmode="numeric"]')
    await otpInputs.nth(0).fill('1')
    await otpInputs.nth(1).fill('2')
    await otpInputs.nth(2).fill('3')
    await otpInputs.nth(3).fill('4')
    await otpInputs.nth(4).fill('5')
    await otpInputs.nth(5).fill('6')
    await page.getByRole('button', { name: /verificar/i }).click()

    // 5. Checkout paso 3 — ventana de recogida
    await expect(page.getByText('10:00 – 12:00')).toBeVisible()
    await page.getByText('10:00 – 12:00').click()
    await page.getByRole('button', { name: /confirmar pedido/i }).click()

    // 6. Página de confirmación
    await page.waitForURL(`${BASE}/confirmation/**`)
    await expect(page.getByText('A7K2M9')).toBeVisible()
    await expect(page.getByText(/pedido confirmado/i)).toBeVisible()
  })
})
