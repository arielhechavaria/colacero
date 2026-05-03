'use client'

import { useEffect } from 'react'
import { telegramAuth } from '../lib/client-api'

/**
 * Se monta en el layout raíz.
 * Si el catálogo corre dentro de Telegram Mini App:
 *   1. Toma el initData firmado por Telegram
 *   2. Lo valida en el backend → recibe JWT
 *   3. Guarda token + displayName en sessionStorage para el checkout
 *
 * @twa-dev/sdk se importa dinámicamente para evitar que acceda a `window`
 * durante el build SSR de Next.js.
 */
export function TelegramAuthProvider() {
  useEffect(() => {
    // Si ya hay token de esta sesión, no re-autenticar
    if (sessionStorage.getItem('colacero_token')) return

    void (async () => {
      try {
        // Import dinámico: solo se ejecuta en el browser, nunca en SSR
        const { default: WebApp } = await import('@twa-dev/sdk')

        const initData = WebApp.initData
        if (!initData) return   // no estamos dentro de Telegram Mini App

        WebApp.ready()

        const result = await telegramAuth(initData)
        sessionStorage.setItem('colacero_token', result.token)
        if (result.customer.displayName) {
          sessionStorage.setItem('colacero_display_name', result.customer.displayName)
        }
      } catch (err) {
        console.error('[TelegramAuth] falló la autenticación:', err)
      }
    })()
  }, [])

  return null
}
