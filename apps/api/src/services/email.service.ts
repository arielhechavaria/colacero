import { env } from '@colacero/env'

interface SendPasswordResetInput {
  to:               string
  resetLink:        string
  expiresInMinutes: number
}

export async function sendPasswordResetEmail(input: SendPasswordResetInput): Promise<void> {
  const { to, resetLink, expiresInMinutes } = input

  if (!env.RESEND_API_KEY) {
    // Fallback: loguear en consola (dev / sin email configurado)
    console.warn(`[EMAIL_MOCK] Password reset for ${to}`)
    console.warn(`[EMAIL_MOCK] Link (expires in ${expiresInMinutes}min): ${resetLink}`)
    return
  }

  const { Resend } = await import('resend')
  const resend = new Resend(env.RESEND_API_KEY)

  await resend.emails.send({
    from:    env.FROM_EMAIL ?? 'ColaCero <noreply@colacero.com>',
    to,
    subject: 'Restablecer tu contraseña — ColaCero',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="margin-bottom: 8px;">Restablecer contraseña</h2>
        <p style="color: #64748b;">Recibiste este email porque solicitaste restablecer tu contraseña en ColaCero.</p>
        <a href="${resetLink}"
           style="display:inline-block; margin: 24px 0; padding: 12px 24px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
          Restablecer contraseña
        </a>
        <p style="color: #94a3b8; font-size: 14px;">
          El link expira en ${expiresInMinutes} minutos.<br>
          Si no solicitaste esto, ignorá este email.
        </p>
      </div>
    `,
  })
}

interface SendVerificationInput {
  to:             string
  verifyLink:     string
  expiresInHours: number
}

export async function sendVerificationEmail(input: SendVerificationInput): Promise<void> {
  const { to, verifyLink, expiresInHours } = input

  if (!env.RESEND_API_KEY) {
    console.warn(`[EMAIL_MOCK] Verify email for ${to}`)
    console.warn(`[EMAIL_MOCK] Link (expires in ${expiresInHours}h): ${verifyLink}`)
    return
  }

  const { Resend } = await import('resend')
  const resend = new Resend(env.RESEND_API_KEY)

  await resend.emails.send({
    from:    env.FROM_EMAIL ?? 'ColaCero <noreply@colacero.com>',
    to,
    subject: 'Verificá tu email — ColaCero',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="margin-bottom: 8px;">¡Bienvenido a ColaCero!</h2>
        <p style="color: #64748b;">Confirmá tu email para activar todas las funciones de tu cuenta.</p>
        <a href="${verifyLink}"
           style="display:inline-block; margin: 24px 0; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 500;">
          Verificar email
        </a>
        <p style="color: #94a3b8; font-size: 14px;">
          El link expira en ${expiresInHours} horas.<br>
          Si no creaste esta cuenta, ignorá este email.
        </p>
      </div>
    `,
  })
}
