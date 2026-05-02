'use client'

import { useEffect } from 'react'
import WebApp from '@twa-dev/sdk'
import { telegramAuth } from '../lib/client-api'

/**
 * Se monta en el layout raíz.
 * Si el catálogo corre dentro de Telegram Mini App:
 *   1. Toma el initData firmado por Telegram
 *   2. Lo valida en el backend → recibe JWT
 *   3. Guarda token + displayName en sessionStorage para el checkout
 */
export function TelegramAuthProvider() {
  useEffect(() => {
    // Solo corre dentro de Telegram Mini App
    const initData = WebApp.initData
    if (!initData) return

    // Si ya hay token de esta sesión, no re-autenticar
    if (sessionStorage.getItem('colacero_token')) return

    WebApp.ready()

    void (async () => {
      try {
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
