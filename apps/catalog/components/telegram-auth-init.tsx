'use client'

import { useEffect } from 'react'
import { telegramAuth } from '../lib/client-api'

/**
 * Se monta silenciosamente en el layout del catálogo.
 * Si el catálogo se abre dentro de Telegram (Mini App), valida el
 * initData con el backend y guarda el token en sessionStorage.
 * El checkout detecta ese token y salta el paso de OTP completo.
 */
export function TelegramAuthInit() {
  useEffect(() => {
    const tg = (window as { Telegram?: { WebApp?: { initData?: string; ready?: () => void } } })
      .Telegram?.WebApp

    if (!tg?.initData) return                                    // no estamos en Telegram
    if (sessionStorage.getItem('colacero_token')) return        // ya autenticado

    tg.ready?.()

    void telegramAuth(tg.initData)
      .then((result) => {
        sessionStorage.setItem('colacero_token', result.token)
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
