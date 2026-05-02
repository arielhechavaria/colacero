import type { Metadata } from 'next'
import { Manrope, Inter, Syne, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { AppShell } from '../components/app-shell'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
})

const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ColaCero — Panel',
  description: 'Panel de gestión para el negocio',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('theme');
                var dark = t ? t === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (dark) document.documentElement.classList.add('dark');
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body
        className={`
          ${manrope.variable} ${inter.variable} ${syne.variable} ${jetbrainsMono.variable}
          min-h-screen antialiased
          [--font-display:var(--font-manrope)] [--font-body:var(--font-inter)] [--font-mono:var(--font-manrope)]
          dark:[--font-display:var(--font-syne)] dark:[--font-mono:var(--font-jetbrains)]
        `}
      >
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
