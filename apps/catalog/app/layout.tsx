import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { TelegramAuthProvider } from '../components/telegram-auth-provider'
import './globals.css'

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
  metadataBase: new URL(process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://colacero.com'),
  title: {
    default:  'ColaCero — Recibí pedidos por Telegram. Cero comisiones.',
    template: '%s · ColaCero',
  },
  description:
    'Plataforma para negocios cubanos: catálogo público, panel de gestión y pedidos por Telegram. Sin comisiones por pedido, sin intermediarios.',
  icons: {
    icon:     [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple:    '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    type:        'website',
    locale:      'es_CU',
    url:         'https://colacero.com',
    siteName:    'ColaCero',
    title:       'ColaCero — Recibí pedidos por Telegram. Cero comisiones.',
    description: 'Tu negocio en línea con catálogo, reservas de stock y notificaciones a tus clientes — sin pagar por pedido.',
  },
  twitter: {
    card:        'summary_large_image',
    title:       'ColaCero — Recibí pedidos por Telegram',
    description: 'Catálogo, panel y pedidos para negocios cubanos. Cero comisiones.',
  },
  robots: {
    index:   true,
    follow:  true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen antialiased overflow-x-hidden`}>
        <TelegramAuthProvider />
        {children}
      </body>
    </html>
  )
}
