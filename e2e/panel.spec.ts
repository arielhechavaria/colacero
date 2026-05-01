import { test, expect } from '@playwright/test'
import { PANEL_URL, OWNER_EMAIL, OWNER_PASSWORD } from './helpers'

test.describe('Panel — flujo dueño', () => {

  test.beforeEach(async ({ page }) => {
    // Login antes de cada test
    await page.goto(`${PANEL_URL}/login`)
    await page.getByLabel('Email').fill(OWNER_EMAIL)
    await page.getByLabel('Contraseña').fill(OWNER_PASSWORD)
    await page.getByRole('button', { name: 'Ingresar' }).click()
    await page.waitForURL(`${PANEL_URL}/orders`)
  })

  test('login exitoso redirige a /orders', async ({ page }) => {
    await expect(page).toHaveURL(`${PANEL_URL}/orders`)
    await expect(page.getByRole('heading', { name: /pedidos del día/i })).toBeVisible()
  })

  test('header muestra botones de navegación', async ({ page }) => {
    await expect(page.getByRole('button', { name: /anunciar/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /cola/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /ventanas/i })).toBeVisible()
  })

  test('navega a /windows y muestra ventanas del día', async ({ page }) => {
    await page.getByRole('button', { name: /ventanas/i }).click()
    await page.waitForURL(`${PANEL_URL}/windows`)
    await expect(page.getByRole('heading', { name: /ventanas de recogida/i })).toBeVisible()
  })

  test('navega a /queue — cola de preparación', async ({ page }) => {
    await page.getByRole('button', { name: /cola/i }).click()
    await page.waitForURL(`${PANEL_URL}/queue`)
    await expect(page.getByRole('heading', { name: /cola de preparación/i })).toBeVisible()
  })

  test('navega a /announcements y puede publicar anuncio (mock)', async ({ page }) => {
    // Mock del endpoint de anuncios para no depender de Telegram real
    await page.route('**/api/owner/announcements', route => {
      void route.fulfill({ status: 202, contentType: 'application/json',
        body: JSON.stringify({ jobId: 'test-job-1', queue: 'announcements' }) })
    })

    await page.getByRole('button', { name: /anunciar/i }).click()
    await page.waitForURL(`${PANEL_URL}/announcements`)

    const textarea = page.getByPlaceholder(/mañana martes/i)
    await textarea.fill('🐔 Test — Pollo disponible mañana $350/lb')

    await page.getByRole('button', { name: /publicar en canal/i }).click()

    // Debe aparecer en el historial
    await expect(page.getByText('Test — Pollo disponible mañana')).toBeVisible()
    await expect(page.getByText(/enviado a las/i)).toBeVisible()
  })

  test('crear ventana de recogida', async ({ page }) => {
    await page.goto(`${PANEL_URL}/windows`)

    await page.getByRole('button', { name: /\+ nueva/i }).click()

    // Rellenar formulario
    const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD
    await page.getByLabel('Fecha').fill(today)
    await page.getByLabel('Desde').fill('08:00')
    await page.getByLabel('Hasta').fill('10:00')
    await page.getByLabel(/capacidad/i).fill('5')

    await page.getByRole('button', { name: /crear ventana/i }).click()

    // La nueva ventana debe aparecer en la lista
    await expect(page.getByText('08:00 – 10:00')).toBeVisible()
  })
})
