import { notFound } from 'next/navigation'
import { getCatalog } from '../../lib/api'
import { Logo } from '../../components/logo'
import { ThemeToggle } from '../../components/theme-toggle'
import { CatalogView } from '../../components/catalog-view'
import { CartSidebar } from '../../components/cart-sidebar'

export const revalidate = 60

interface Props {
  params: Promise<{ slug: string }>
}

export default async function CatalogPage({ params }: Props) {
  const { slug } = await params
  const data = await getCatalog(slug)
  if (data == null) notFound()

  const activeCount = data.products.filter((p) => p.isActive).length

  return (
    <main className="min-h-screen">
      {/* Header — sticky, full width */}
      <header
        className="sticky top-0 z-10 glass lg:h-16 px-4 py-3 lg:py-0"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="h-full max-w-screen-2xl mx-auto lg:px-6 flex items-center gap-3">
          <Logo size="sm" className="flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold leading-tight truncate" style={{ color: 'var(--text)' }}>
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

      {/* Body — stacked on mobile, 2-col on desktop */}
      <div className="max-w-screen-2xl mx-auto lg:flex lg:items-stretch lg:min-h-[calc(100vh-4rem)]">

        {/* Left — hero + catalog */}
        <div className="flex-1 min-w-0 flex flex-col">

          {/* Hero — desktop only */}
          <section
            className="hidden lg:block px-8 py-10 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="max-w-2xl">
              <span
                className="inline-flex items-center gap-1.5 mb-3 rounded-full px-3 py-1 text-xs font-semibold"
                style={{
                  backgroundColor: 'var(--primary-dim)',
                  color:           'var(--primary)',
                  border:          '1px solid var(--border-glow)',
                }}
              >
                🟢 Pedidos abiertos
              </span>
              <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)' }}>
                {data.business.name}
              </h1>
              {data.business.description && (
                <p className="mt-2 text-base" style={{ color: 'var(--muted)' }}>
                  {data.business.description}
                </p>
              )}
              <div
                className="mt-5 flex items-center gap-5 text-xs font-medium"
                style={{ color: 'var(--muted)' }}
              >
                <span>📦 {activeCount} {activeCount === 1 ? 'producto' : 'productos'} disponibles</span>
                <span>⏰ Reservá antes de las 20:00 hs</span>
                <span>🏠 Retiro sin cola</span>
              </div>
            </div>
          </section>

          {/* Catalog */}
          <div
            className="px-4 py-4 lg:px-8 lg:py-6 flex-1"
            style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
          >
            {data.products.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-20 text-center">
                <span className="text-5xl">📭</span>
                <p className="text-base font-semibold" style={{ color: 'var(--text)' }}>Sin productos publicados</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Este negocio aún no tiene productos en su catálogo.
                </p>
              </div>
            ) : (
              <CatalogView products={data.products} />
            )}
          </div>
        </div>

        {/* Right — persistent cart (desktop only) */}
        <div className="hidden lg:block w-[360px] flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)]">
          <CartSidebar />
        </div>
      </div>
    </main>
  )
}
