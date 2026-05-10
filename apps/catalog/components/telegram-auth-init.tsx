'use client'

import { useEffect } from 'react'
import { telegramAuth, isAuthenticatedClient } from '../lib/client-api'

/**
 * Se monta silenciosamente en el layout del catálogo.
 * Si el catálogo se abre dentro de Telegram (Mini App), valida el
 * initData con el backend; el server setea las cookies httpOnly de sesión.
 * El checkout detecta la sesión via cookie y salta el paso de OTP completo.
 */
export function TelegramAuthInit() {
  useEffect(() => {
    const tg = (window as { Telegram?: { WebApp?: { initData?: string; ready?: () => void } } })
      .Telegram?.WebApp

    if (!tg?.initData)             return  // no estamos en Telegram
    if (isAuthenticatedClient())   return  // ya autenticado (cookie cc_csrf presente)

    tg.ready?.()

    void telegramAuth(tg.initData)
      .then((result) => {
        if (result.customer.displayName) {
          sessionStorage.setItem('colacero_display_name', result.customer.displayName)
        }
      })
      .catch(() => {
        // initData inválido o expirado — flujo normal con OTP
      })
  }, [])

  return null
}
