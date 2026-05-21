'use client'

import { useEffect, useRef, useState } from 'react'

export interface TelegramUser {
  id:          number
  first_name:  string
  last_name?:  string
  username?:   string
  photo_url?:  string
  auth_date:   number
  hash:        string
}

interface Props {
  botUsername: string                                 // ej. 'ColaCeroBot' (sin @)
  onAuth:      (user: TelegramUser) => void | Promise<void>
  size?:       'large' | 'medium' | 'small'
  radius?:     number
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramUser) => void
  }
}

/**
 * Wrapper del widget oficial de Telegram Login.
 *
 * Spec: https://core.telegram.org/widgets/login
 *
 * Requisitos:
 *   - El bot debe tener `/setdomain` configurado en @BotFather con el dominio
 *     desde el que se carga la página (ej. colacero.com, *.colacero.com)
 *   - El bot debe tener acceso de escritura para poder enviar DMs futuros
 *     (data-request-access="write")
 *
 * Comportamiento:
 *   - Mobile: tap → abre Telegram app → confirmar → vuelve con datos firmados
 *   - Desktop: muestra QR code → escanear con Telegram mobile → confirmar
 */
export function TelegramLoginButton({
  botUsername,
  onAuth,
  size   = 'large',
  radius = 12,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Callback global que el script de Telegram invoca al completar el login
    window.onTelegramAuth = (user) => {
      void onAuth(user)
    }

    const script = document.createElement('script')
    script.async = true
    script.src   = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-login', botUsername)
    script.setAttribute('data-size',           size)
    script.setAttribute('data-radius',         String(radius))
    script.setAttribute('data-onauth',         'onTelegramAuth(user)')
    script.setAttribute('data-request-access', 'write')

    script.onerror = () => setError('No pudimos cargar el widget de Telegram')

    const container = ref.current
    container?.appendChild(script)

    return () => {
      delete window.onTelegramAuth
      if (script.parentNode) script.parentNode.removeChild(script)
      // Limpiar iframe que el widget inyecta al cargar
      if (container) {
        const iframe = container.querySelector('iframe')
        if (iframe) iframe.remove()
      }
    }
  }, [botUsername, onAuth, size, radius])

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={ref} />
      {error && (
        <p className="text-sm" style={{ color: 'var(--error)' }}>{error}</p>
      )}
    </div>
  )
}
