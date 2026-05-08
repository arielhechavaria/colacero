import { notFound } from 'next/navigation'
import { getCatalog } from '../../lib/api'
import { Logo } from '../../components/logo'
import { ThemeToggle } from '../../components/theme-toggle'
import { CatalogView } from '../../components/catalog-view'

export const revalidate = 60 // ISR — revalida cada 60s

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CatalogPage({ params }: Props) {
  const { slug } = await params
  const data = await getCatalog(slug)
  if (data == null) notFound()

  return (
    <main className="min-h-screen">
      {/* Header glass */}
      <header
        className="sticky top-0 z-10 glass px-4 py-3"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <Logo size="sm" className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1
              className="text-sm font-bold leading-tight truncate"
              style={{ color: 'var(--text)' }}
            >
              {data.business.name}
            </h1>
            <span
              className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mt-0.5"
              style={{
                backgroundColor: 'var(--primary-dim)',
                color:           'var(--primary)',
                border:          '1px solid var(--border-glow)',
              }}
            >
              recogé sin cola
            </span>
          </div>
          <ThemeToggle className="flex-shrink-0" />
        </div>
      </header>

      {/* Productos — pb extra para el FAB */}
      <div
        className="mx-auto max-w-lg px-4 py-4"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        {data.products.length === 0 ? (
          <p className="py-16 text-center" style={{ color: 'var(--muted)' }}>
            Este negocio aún no tiene productos publicados.
          </p>
        ) : (
          <CatalogView products={data.products} />
        )}
      </div>
    </main>
  )
}
