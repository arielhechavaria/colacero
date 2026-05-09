'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustInventory,
  type Product,
  type CreateProductInput,
} from '../../lib/api'
import { toast } from 'sonner'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge }    from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '../../components/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'

// ── Unit options ──────────────────────────────────────────────────────────────

const UNIT_OPTIONS = [
  'unidad', 'libra', 'kg', 'litro', 'saco',
  'caja', 'paquete', 'docena', 'bandeja', 'bolsa',
]

// ── Stock badge ───────────────────────────────────────────────────────────────

function StockBadge({ inv, unitLabel }: { inv: Product['inventory']; unitLabel: string }) {
  if (!inv) return <span style={{ color: 'var(--muted)', fontSize: 12 }}>Sin inventario</span>

  const { quantityAvailable, lowStockThreshold } = inv

  if (quantityAvailable === 0) {
    return <Badge variant="destructive">Sin stock</Badge>
  }
  if (quantityAvailable <= lowStockThreshold) {
    return <Badge variant="warning">{quantityAvailable} / {lowStockThreshold} {unitLabel}</Badge>
  }
  return <Badge variant="success">{quantityAvailable} {unitLabel}</Badge>
}

// ── Inventory adjuster (inline) ───────────────────────────────────────────────

function InventoryAdjuster({
  product,
  token,
  onUpdated,
}: {
  product:   Product
  token:     string
  onUpdated: (p: Product) => void
}) {
  const inv = product.inventory
  const [delta, setDelta]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  if (!inv) return null

  async function apply(sign: 1 | -1) {
    const n = parseInt(delta, 10)
    if (isNaN(n) || n <= 0) return
    setLoading(true)
    setError(null)
    try {
      const newQty = Math.max(0, inv!.quantityAvailable + sign * n)
      const updated = await adjustInventory(token, product.id, inv!.version, newQty)
      onUpdated({ ...product, inventory: updated })
      setDelta('')
    } catch (e) {
      setError(e instanceof Error && e.message === 'adjust_inventory_failed' ? 'Conflicto de versión, recargá' : 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <button
        onClick={() => void apply(-1)}
        disabled={loading || delta === ''}
        className="h-7 w-7 rounded-lg text-sm font-bold disabled:opacity-30 transition-all"
        style={{ background: 'rgba(248,113,113,0.12)', color: 'var(--error)' }}
        title="Reducir stock"
      >−</button>

      <Input
        type="number"
        min="1"
        value={delta}
        onChange={(e) => setDelta(e.target.value)}
        placeholder="Cant."
        className="w-16 text-xs text-center font-mono h-7"
      />

      <button
        onClick={() => void apply(1)}
        disabled={loading || delta === ''}
        className="h-7 w-7 rounded-lg text-sm font-bold disabled:opacity-30 transition-all"
        style={{ background: 'rgba(52,211,153,0.12)', color: 'var(--success)' }}
        title="Agregar stock"
      >+</button>

      {error && <span className="text-[11px]" style={{ color: 'var(--error)' }}>{error}</span>}
    </div>
  )
}

// ── Product card ──────────────────────────────────────────────────────────────

function ProductCard({
  product,
  token,
  onEdit,
  onToggle,
  onDelete,
  onUpdated,
}: {
  product:   Product
  token:     string
  onEdit:    (p: Product) => void
  onToggle:  (p: Product) => void
  onDelete:  (p: Product) => void
  onUpdated: (p: Product) => void
}) {
  return (
    <div
      className={`glass rounded-2xl p-4 flex flex-col gap-2 transition-all ${!product.isActive ? 'opacity-50' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm leading-snug" style={{ color: 'var(--text)' }}>
            {product.name}
          </p>
          {product.sku && (
            <p className="text-[11px] font-mono mt-0.5" style={{ color: 'var(--muted)' }}>
              SKU: {product.sku}
            </p>
          )}
          {product.description && (
            <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--muted)' }}>
              {product.description}
            </p>
          )}
        </div>
        {/* Active toggle */}
        <button
          onClick={() => onToggle(product)}
          className="flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-all"
          style={
            product.isActive
              ? { background: 'rgba(52,211,153,0.12)', color: 'var(--success)' }
              : { background: 'rgba(107,114,128,0.12)', color: 'var(--muted)' }
          }
          title={product.isActive ? 'Desactivar producto' : 'Activar producto'}
        >
          {product.isActive ? 'Activo' : 'Inactivo'}
        </button>
      </div>

      {/* Price + stock */}
      <div className="flex items-center justify-between">
        <p className="text-base font-black font-mono text-gradient">
          ${Number(product.unitPrice).toFixed(2)}
          <span className="text-xs font-normal ml-1" style={{ color: 'var(--muted)' }}>
            / {product.unitLabel}
          </span>
        </p>
        <StockBadge inv={product.inventory} unitLabel={product.unitLabel} />
      </div>

      {/* Inventory adjuster */}
      <InventoryAdjuster product={product} token={token} onUpdated={onUpdated} />

      {/* Actions */}
      <div className="flex gap-2 mt-1 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onEdit(product)}
        >
          Editar
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onDelete(product)}
        >
          Eliminar
        </Button>
      </div>
    </div>
  )
}

// ── Product form (create / edit) ──────────────────────────────────────────────

interface FormValues {
  name:               string
  sku:                string
  description:        string
  unitPrice:          string
  unitLabel:          string
  imageUrl:           string
  category:           string
  initialQuantity:    string
  lowStockThreshold:  string
}

const EMPTY: FormValues = {
  name: '', sku: '', description: '', unitPrice: '', unitLabel: 'unidad',
  imageUrl: '', category: '', initialQuantity: '0', lowStockThreshold: '5',
}

function productToForm(p: Product): FormValues {
  return {
    name:              p.name,
    sku:               p.sku ?? '',
    description:       p.description ?? '',
    unitPrice:         String(p.unitPrice),
    unitLabel:         p.unitLabel,
    imageUrl:          p.imageUrl ?? '',
    category:          p.category ?? '',
    initialQuantity:   String(p.inventory?.quantityAvailable ?? 0),
    lowStockThreshold: String(p.inventory?.lowStockThreshold ?? 5),
  }
}

function ProductModal({
  open,
  editing,
  token,
  existingCategories,
  onSave,
  onClose,
}: {
  open:                boolean
  editing:             Product | null
  token:               string
  existingCategories:  string[]
  onSave:              (p: Product) => void
  onClose:             () => void
}) {
  const [form, setForm]               = useState<FormValues>(editing ? productToForm(editing) : EMPTY)
  const [isCustomUnit, setIsCustomUnit] = useState(() => !UNIT_OPTIONS.includes(form.unitLabel))
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // Sync form when editing target changes
  useEffect(() => {
    const f = editing ? productToForm(editing) : EMPTY
    setForm(f)
    setIsCustomUnit(!UNIT_OPTIONS.includes(f.unitLabel))
    setError(null)
  }, [editing, open])

  function set(field: keyof FormValues, val: string) {
    setForm((f) => ({ ...f, [field]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (editing) {
        const updated = await updateProduct(token, editing.id, {
          name:      form.name.trim(),
          unitPrice: parseFloat(form.unitPrice),
          unitLabel: form.unitLabel.trim() || 'unidad',
          ...(form.sku.trim()          ? { sku:         form.sku.trim()          } : {}),
          ...(form.description.trim()  ? { description: form.description.trim()  } : {}),
          ...(form.imageUrl.trim()     ? { imageUrl:    form.imageUrl.trim()     } : {}),
          ...(form.category.trim()     ? { category:    form.category.trim()     } : { category: null }),
        })
        onSave(updated)
      } else {
        const input: CreateProductInput = {
          name:              form.name.trim(),
          unitPrice:         parseFloat(form.unitPrice),
          unitLabel:         form.unitLabel.trim() || 'unidad',
          initialQuantity:   parseInt(form.initialQuantity, 10) || 0,
          lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 5,
          ...(form.sku.trim()         ? { sku:         form.sku.trim()         } : {}),
          ...(form.description.trim() ? { description: form.description.trim() } : {}),
          ...(form.imageUrl.trim()    ? { imageUrl:    form.imageUrl.trim()    } : {}),
          ...(form.category.trim()    ? { category:    form.category.trim()    } : {}),
        }
        const created = await createProduct(token, input)
        onSave(created)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'error'
      const friendly = msg === 'sku_duplicate'
        ? 'Ya existe un producto con ese SKU'
        : msg === 'create_product_failed' || msg === 'update_product_failed'
          ? 'Error al guardar el producto'
          : msg
      toast.error(friendly)
      setError(friendly)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Editar producto' : 'Nuevo producto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          {/* Nombre */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-name">Nombre *</Label>
            <Input
              id="prod-name"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej: Carne de cerdo"
            />
          </div>

          {/* Precio + Unidad */}
          <div className="flex gap-3">
            <div className="flex-1 flex flex-col gap-1.5">
              <Label htmlFor="prod-price">Precio *</Label>
              <Input
                id="prod-price"
                required
                type="number"
                min="0"
                step="0.01"
                value={form.unitPrice}
                onChange={(e) => set('unitPrice', e.target.value)}
                placeholder="0.00"
                className="font-mono"
              />
            </div>
            <div className="w-40 flex flex-col gap-1.5">
              <Label htmlFor="prod-unit">Unidad</Label>
              <select
                id="prod-unit"
                value={isCustomUnit ? '__custom__' : form.unitLabel}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomUnit(true)
                    set('unitLabel', '')
                  } else {
                    setIsCustomUnit(false)
                    set('unitLabel', e.target.value)
                  }
                }}
                className="h-9 w-full rounded-md border px-2 text-sm"
                style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text)' }}
              >
                {UNIT_OPTIONS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
                <option value="__custom__">Otro…</option>
              </select>
              {isCustomUnit && (
                <Input
                  value={form.unitLabel}
                  onChange={(e) => set('unitLabel', e.target.value)}
                  placeholder="Ej: arroba"
                  className="mt-1"
                />
              )}
            </div>
          </div>

          {/* SKU */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-sku">
              SKU{' '}
              <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                (opcional)
              </span>
            </Label>
            <Input
              id="prod-sku"
              value={form.sku}
              onChange={(e) => set('sku', e.target.value)}
              placeholder="Ej: CERDO-001"
              className="font-mono"
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-desc">Descripción</Label>
            <Textarea
              id="prod-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={2}
              placeholder="Descripción breve..."
              className="resize-none"
            />
          </div>

          {/* Stock inicial — solo en creación */}
          {!editing && (
            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-1.5">
                <Label htmlFor="prod-qty">Stock inicial</Label>
                <Input
                  id="prod-qty"
                  type="number"
                  min="0"
                  value={form.initialQuantity}
                  onChange={(e) => set('initialQuantity', e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                <Label htmlFor="prod-threshold">Alerta bajo stock</Label>
                <Input
                  id="prod-threshold"
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) => set('lowStockThreshold', e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          )}

          {/* Categoría */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-category">
              Categoría{' '}
              <span style={{ color: 'var(--muted)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                (opcional)
              </span>
            </Label>
            <Input
              id="prod-category"
              list="categories-list"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              placeholder="Ej: Carnes, Granos, Lácteos…"
            />
            <datalist id="categories-list">
              {existingCategories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          {/* Imagen URL */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-img">URL de imagen</Label>
            <Input
              id="prod-img"
              type="url"
              value={form.imageUrl}
              onChange={(e) => set('imageUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          {error && (
            <p
              className="rounded-xl px-3 py-2 text-sm"
              style={{ background: 'rgba(248,113,113,0.1)', color: 'var(--error)' }}
            >
              {error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-[2]"
            >
              {loading ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteDialog({
  open,
  product,
  token,
  onDeleted,
  onClose,
}: {
  open:      boolean
  product:   Product | null
  token:     string
  onDeleted: (id: string) => void
  onClose:   () => void
}) {
  const [loading, setLoading] = useState(false)

  async function confirm() {
    if (!product) return
    setLoading(true)
    try {
      await deleteProduct(token, product.id)
      onDeleted(product.id)
    } catch {
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>¿Desactivar producto?</DialogTitle>
          <DialogDescription>
            <strong style={{ color: 'var(--text)' }}>{product?.name}</strong> se ocultará del catálogo.
            Podés reactivarlo luego.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={loading}
            onClick={() => void confirm()}
          >
            {loading ? 'Desactivando…' : 'Desactivar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const router = useRouter()

  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [search,   setSearch]   = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [sortBy,   setSortBy]   = useState('name-asc')

  const [modal,  setModal]  = useState<'create' | 'edit' | 'delete' | null>(null)
  const [target, setTarget] = useState<Product | null>(null)

  const tokenRef = useRef<string | null>(null)

  const load = useCallback(async (tok: string) => {
    try {
      const list = await getProducts(tok)
      setProducts(list)
      setError(null)
    } catch {
      toast.error('Error al cargar productos')
      setError('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = sessionStorage.getItem('panel_token')
    if (!token) { router.replace('/login'); return }
    tokenRef.current = token
    void load(token)
  }, [load, router])

  // ── handlers ──────────────────────────────────────────────────────────────

  function openCreate() { setTarget(null); setModal('create') }
  function openEdit(p: Product) { setTarget(p); setModal('edit') }
  function openDelete(p: Product) { setTarget(p); setModal('delete') }
  function closeModal() { setModal(null); setTarget(null) }

  function handleSaved(p: Product) {
    setProducts((prev) => {
      const idx = prev.findIndex((x) => x.id === p.id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = p; return next
      }
      return [p, ...prev]
    })
    toast.success(modal === 'create' ? 'Producto creado' : 'Producto actualizado')
    closeModal()
  }

  function handleDeleted(id: string) {
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isActive: false } : p))
    closeModal()
  }

  function handleUpdated(p: Product) {
    setProducts((prev) => prev.map((x) => x.id === p.id ? p : x))
  }

  async function handleToggle(p: Product) {
    const token = tokenRef.current
    if (!token) return
    try {
      const updated = await updateProduct(token, p.id, { isActive: !p.isActive })
      handleUpdated(updated)
    } catch { /* ignore */ }
  }

  // ── filter + sort (in-memory) ─────────────────────────────────────────────

  const categories = useMemo(() =>
    [...new Set(products.map((p) => p.category).filter((c): c is string => c != null && c !== ''))].sort(),
    [products],
  )

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      const q = search.trim().toLowerCase()
      const matchSearch = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q)
      const matchCat = !categoryFilter || p.category === categoryFilter
      return matchSearch && matchCat
    })

    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':   return a.name.localeCompare(b.name)
        case 'price-asc':  return Number(a.unitPrice) - Number(b.unitPrice)
        case 'price-desc': return Number(b.unitPrice) - Number(a.unitPrice)
        case 'stock-asc':  return (a.inventory?.quantityAvailable ?? 0) - (b.inventory?.quantityAvailable ?? 0)
        case 'stock-desc': return (b.inventory?.quantityAvailable ?? 0) - (a.inventory?.quantityAvailable ?? 0)
        default:           return 0
      }
    })
  }, [products, search, categoryFilter, sortBy])

  const active   = filtered.filter((p) => p.isActive)
  const inactive = filtered.filter((p) => !p.isActive)

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="min-h-screen">
        <div className="px-6 py-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2 flex-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
              <div className="flex gap-2 mt-1">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </main>
    )
  }

  const token = tokenRef.current ?? ''

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header
        className="sticky top-0 z-10 glass px-6 py-4"
        style={{ borderBottom: '1px solid var(--glass-border)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-gradient">Catálogo de productos</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {products.filter((p) => p.isActive).length} activos · {products.filter((p) => !p.isActive).length} inactivos
            </p>
          </div>
          <Button onClick={openCreate}>
            + Nuevo producto
          </Button>
        </div>

        {/* Toolbar */}
        <div className="mt-3 flex flex-wrap gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-40">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'var(--muted)' }}
            >🔍</span>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU…"
              className="pl-9"
            />
          </div>

          {/* Category filter */}
          {categories.length > 0 && (
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-md border px-3 text-sm"
              style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text)' }}
            >
              <option value="">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-9 rounded-md border px-3 text-sm"
            style={{ background: 'var(--glass-bg)', borderColor: 'var(--glass-border)', color: 'var(--text)' }}
          >
            <option value="name-asc">Nombre A-Z</option>
            <option value="price-asc">Precio ↑</option>
            <option value="price-desc">Precio ↓</option>
            <option value="stock-asc">Stock ↑</option>
            <option value="stock-desc">Stock ↓</option>
          </select>
        </div>
      </header>

      <div className="px-6 py-5 flex flex-col gap-6">
        {error && (
          <div className="rounded-xl px-4 py-3 text-sm"
            style={{ background: 'rgba(248,113,113,0.08)', color: 'var(--error)', border: '1px solid rgba(248,113,113,0.2)' }}>
            {error}
          </div>
        )}

        {products.length === 0 && !error && (
          <EmptyState
            icon="📦"
            title="Todavía no tenés productos"
            description="Creá tu primer producto para que aparezca en el catálogo y los clientes puedan hacer pedidos."
            action={{ label: '+ Crear primer producto', onClick: openCreate }}
          />
        )}

        {/* Activos */}
        {active.length > 0 && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Activos ({active.length})
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  token={token}
                  onEdit={openEdit}
                  onToggle={handleToggle}
                  onDelete={openDelete}
                  onUpdated={handleUpdated}
                />
              ))}
            </div>
          </section>
        )}

        {/* Inactivos */}
        {inactive.length > 0 && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
              Inactivos ({inactive.length})
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {inactive.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  token={token}
                  onEdit={openEdit}
                  onToggle={handleToggle}
                  onDelete={openDelete}
                  onUpdated={handleUpdated}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Dialogs */}
      <ProductModal
        open={modal === 'create' || modal === 'edit'}
        editing={modal === 'edit' ? target : null}
        token={token}
        existingCategories={[...new Set(products.map((p) => p.category).filter((c): c is string => c != null && c !== ''))].sort()}
        onSave={handleSaved}
        onClose={closeModal}
      />

      <DeleteDialog
        open={modal === 'delete'}
        product={target}
        token={token}
        onDeleted={handleDeleted}
        onClose={closeModal}
      />
    </main>
  )
}
