'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMe, isAuthenticatedClient } from '../../lib/api'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [allowed, setAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isAuthenticatedClient()) {
      router.replace('/login')
      return
    }
    void getMe('')
      .then((u) => {
        if (u.role === 'SUPER_ADMIN') setAllowed(true)
        else router.replace('/orders')
      })
      .catch(() => router.replace('/login'))
  }, [router])

  if (allowed !== true) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Verificando acceso…
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold text-slate-900">
              ColaCero Admin
            </h1>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin/businesses" className="hover:underline text-slate-500 hover:text-slate-900">
                Negocios
              </Link>
              <Link href="/admin/leads" className="hover:underline text-slate-500 hover:text-slate-900">
                Leads
              </Link>
            </nav>
          </div>
          <Link href="/orders" className="text-sm text-slate-500 hover:text-slate-900">
            ← Volver al panel
          </Link>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8">
        {children}
      </main>
    </div>
  )
}
