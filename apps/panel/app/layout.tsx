import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ColaCero — Panel',
  description: 'Panel de gestión para el negocio',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-100 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
