import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import { AppShell } from '../components/app-shell'

const inter = Inter({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display:  'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  weight:   ['400', '500', '600'],
  variable: '--font-mono',
  display:  'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env['NEXT_PUBLIC_PANEL_URL'] ?? 'https://panel.colacero.com'),
  title: {
    default:  'Panel · ColaCero',
    template: '%s · Panel ColaCero',
  },
  description: 'Panel de gestión para tu negocio en ColaCero',
  icons: {
    icon:     [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple:    '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  robots: {
    index:   false,  // Panel privado — no indexar
    follow:  false,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head />
      <body className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen antialiased`}>
        <AppShell>
          {children}
        </AppShell>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  )
}
