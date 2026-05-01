import { defineConfig, devices } from '@playwright/test'

/**
 * E2E tests — requieren pnpm dev corriendo:
 *   API:     localhost:3000
 *   Catalog: localhost:3001
 *   Panel:   localhost:3002
 *
 * Ejecutar: pnpm test:e2e
 */
export default defineConfig({
  testDir:   './e2e',
  timeout:   30_000,
  retries:   1,
  workers:   1,     // secuencial — los tests comparten estado de DB/Redis
  reporter:  'list',

  use: {
    baseURL:           'http://localhost:3001',
    headless:          true,
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    actionTimeout:     10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name:    'chromium',
      use:     { ...devices['Desktop Chrome'] },
    },
    {
      name:    'mobile',
      use:     { ...devices['Pixel 5'] },
      testMatch: '**/catalog.spec.ts',  // mobile solo para catálogo
    },
  ],
})
