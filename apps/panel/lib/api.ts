'use client'

// URLs relativas — Next.js reescribe /api/* hacia el servicio API via rewrites()
const API_BASE = ''

// ── Auth helpers (cookies + CSRF) ─────────────────────────────────────────────
// Las cookies httpOnly (cc_access, cc_refresh) las pone el server; el browser las
// envía automáticamente con `credentials: 'include'`. cc_csrf NO es httpOnly y la
// leemos desde document.cookie para mandarla en X-CSRF-Token (double-submit).

function readCsrf(): string | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)cc_csrf=([^;]+)/)
  return m ? decodeURIComponent(m[1]!) : null
}

function csrfHeader(): Record<string, string> {
  const t = readCsrf()
  return t ? { 'X-CSRF-Token': t } : {}
}

// ── Auto-refresh interceptor ──────────────────────────────────────────────────
// Si la request falla con 401 (cc_access expirado), intenta renovar la sesión
// una sola vez (singleton para deduplicar concurrent 401s) y reintenta.
// Si el refresh también falla, redirige a /login.

let _pendingRefresh: Promise<boolean> | null = null

async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (res.status !== 401) return res

  // Deduplicar: si ya hay un refresh en vuelo, reusar esa promesa
  if (!_pendingRefresh) {
    _pendingRefresh = fetch(`${API_BASE}/api/auth/refresh`, {
      method:      'POST',
      credentials: 'include',
    })
      .then((r) => r.ok)
      .finally(() => { _pendingRefresh = null })
  }

  const refreshed = await _pendingRefresh
  if (!refreshed) {
    if (typeof window !== 'undefined') window.location.replace('/login')
    return res // inalcanzable si el redirect funciona
  }

  // El nuevo cc_access está en la cookie — reintentar la request original
  return fetch(input, init)  // fetch directo: ya renovamos, no loop
}

/**
 * Heurística client-side: cc_csrf NO es httpOnly y se setea junto con cc_access en login.
 * Si existe, asumimos que tenemos sesión. La verificación dura ocurre en el server (401).
 */
export function isAuthenticatedClient(): boolean {
  return readCsrf() !== null
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'PICKED_UP'
  | 'CANCELLED'
  | 'EXPIRED'

export interface OrderItem {
  id:                string
  productId:         string
  name:              string
  unitLabel:         string
  quantity:          number
  unitPriceSnapshot: number
  subtotal:          number
}

export interface Order {
  id:          string
  pickupCode:  string | null
  status:      OrderStatus
  subtotal:    number
  confirmedAt: string | null
  notes:       string | null
  customer: {
    id:          string
    displayName: string | null
    phone:       string
  }
  items: OrderItem[]
}

export interface PickupWindowGroup {
  id:          string
  date:        string
  startTime:   string
  endTime:     string
  capacity:    number
  ordersCount: number
  orders:      Order[]
}

export interface DayOrders {
  date:    string
  windows: PickupWindowGroup[]
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginUser {
  id:         string
  email:      string
  role:       string
  businessId: string
}

// ── Register ──────────────────────────────────────────────────────────────────

export interface RegisterInput {
  slug:         string
  businessName: string
  ownerName?:   string
  email:        string
  password:     string
}

export interface RegisterResult {
  user:     { id: string; email: string; role: string; businessId: string }
  business: { id: string; slug: string; name: string }
}

export async function registerBusiness(input: RegisterInput): Promise<RegisterResult> {
  const res = await fetch(`${API_BASE}/api/auth/owner/register`, {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'register_failed')
  }
  return res.json() as Promise<RegisterResult>
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/auth/owner/slug-available?slug=${encodeURIComponent(slug)}`)
  if (!res.ok) return false
  const body = await res.json() as { available: boolean }
  return body.available
}

export async function loginOwner(
  email: string,
  password: string,
): Promise<{ user: LoginUser }> {
  const res = await fetch(`${API_BASE}/api/auth/owner/login`, {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'login_failed')
  }
  return res.json() as Promise<{ user: LoginUser }>
}

export async function forgotPassword(email: string): Promise<void> {
  await fetch(`${API_BASE}/api/auth/owner/forgot-password`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email }),
  })
  // Silencioso — el server siempre devuelve 200 (anti-enumeration)
}

export async function sendVerificationEmail(): Promise<{ ok: boolean; alreadyVerified: boolean }> {
  const res = await apiFetch(`${API_BASE}/api/auth/owner/send-verification`, {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'send_verification_failed')
  }
  return res.json() as Promise<{ ok: boolean; alreadyVerified: boolean }>
}

export async function verifyEmail(token: string): Promise<{ ok: boolean; email: string }> {
  const res = await fetch(`${API_BASE}/api/auth/owner/verify-email`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ token }),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'verify_email_failed')
  }
  return res.json() as Promise<{ ok: boolean; email: string }>
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/auth/owner/reset-password`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ token, newPassword }),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'reset_failed')
  }
}

export async function refreshSession(): Promise<boolean> {
  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method:      'POST',
    credentials: 'include',
  })
  return res.ok
}

export async function logout(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method:      'POST',
    headers:     { ...csrfHeader() },
    credentials: 'include',
  })
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function getOrders(token: string, date?: string): Promise<DayOrders> {
  const url = date
    ? `${API_BASE}/api/owner/orders?date=${date}`
    : `${API_BASE}/api/owner/orders`

  const res = await apiFetch(url, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'fetch_orders_failed')
  }
  return res.json() as Promise<DayOrders>
}

// ── Pickup Windows ────────────────────────────────────────────────────────────

export interface PickupWindow {
  id:          string
  date:        string
  startTime:   string
  endTime:     string
  capacity:    number
  ordersCount: number
  spotsLeft:   number
  isOpen:      boolean
}

export interface CreateWindowInput {
  date:      string
  startTime: string
  endTime:   string
  capacity:  number
  isOpen?:   boolean
}

export async function getWindows(token: string): Promise<PickupWindow[]> {
  const res = await apiFetch(`${API_BASE}/api/owner/pickup-windows`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_windows_failed')
  return res.json() as Promise<PickupWindow[]>
}

export async function createWindow(
  token: string,
  input: CreateWindowInput,
): Promise<PickupWindow> {
  const res = await apiFetch(`${API_BASE}/api/owner/pickup-windows`, {
    method:  'POST',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:    JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'create_window_failed')
  }
  return res.json() as Promise<PickupWindow>
}

export async function patchWindow(
  token: string,
  windowId: string,
  data: Partial<Pick<PickupWindow, 'startTime' | 'endTime' | 'capacity' | 'isOpen'>>,
): Promise<PickupWindow> {
  const res = await apiFetch(`${API_BASE}/api/owner/pickup-windows/${windowId}`, {
    method:  'PATCH',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:    JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'patch_window_failed')
  }
  return res.json() as Promise<PickupWindow>
}

export async function deleteWindow(token: string, windowId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/owner/pickup-windows/${windowId}`, {
    method:  'DELETE',
    headers:     { ...csrfHeader() },
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'delete_window_failed')
  }
}

export async function generateTomorrow(
  token: string,
): Promise<{ date: string; created: PickupWindow[] }> {
  const res = await apiFetch(`${API_BASE}/api/owner/pickup-windows/generate-tomorrow`, {
    method:  'POST',
    headers:     { ...csrfHeader() },
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'generate_tomorrow_failed')
  }
  return res.json() as Promise<{ date: string; created: PickupWindow[] }>
}

export async function generateDefaultSchedule(): Promise<{ created: PickupWindow[]; skipped: number }> {
  const res = await apiFetch(`${API_BASE}/api/owner/pickup-windows/generate-schedule`, {
    method:  'POST',
    headers:     { ...csrfHeader() },
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'generate_schedule_failed')
  }
  return res.json() as Promise<{ created: PickupWindow[]; skipped: number }>
}

// ── Products ──────────────────────────────────────────────────────────────────

export interface Inventory {
  productId:          string
  quantityAvailable:  number
  quantityReserved:   number
  lowStockThreshold:  number
  version:            number
  updatedAt:          string
}

export interface Product {
  id:          string
  sku:         string | null
  name:        string
  description: string | null
  unitPrice:   number
  unitLabel:   string
  imageUrl:    string | null
  category:    string | null
  isActive:    boolean
  createdAt:   string
  inventory:   Inventory | null
}

export interface CreateProductInput {
  name:               string
  sku?:               string
  description?:       string
  unitPrice:          number
  unitLabel?:         string
  imageUrl?:          string
  category?:          string | null
  initialQuantity?:   number
  lowStockThreshold?: number
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'initialQuantity'> & { isActive: boolean }>

export async function getProducts(token: string): Promise<Product[]> {
  const res = await apiFetch(`${API_BASE}/api/owner/products`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_products_failed')
  const data = await res.json() as { products: Product[] } | Product[]
  return Array.isArray(data) ? data : data.products
}

export async function createProduct(
  token: string,
  input: CreateProductInput,
): Promise<Product> {
  const res = await apiFetch(`${API_BASE}/api/owner/products`, {
    method:  'POST',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:    JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'create_product_failed')
  }
  return res.json() as Promise<Product>
}

export async function updateProduct(
  token: string,
  productId: string,
  input: UpdateProductInput,
): Promise<Product> {
  const res = await apiFetch(`${API_BASE}/api/owner/products/${productId}`, {
    method:  'PATCH',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:    JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'update_product_failed')
  }
  return res.json() as Promise<Product>
}

export async function deleteProduct(token: string, productId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/owner/products/${productId}`, {
    method:  'DELETE',
    headers:     { ...csrfHeader() },
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'delete_product_failed')
  }
}

export async function getInventory(token: string, productId: string): Promise<Inventory> {
  const res = await apiFetch(`${API_BASE}/api/owner/products/${productId}/inventory`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_inventory_failed')
  return res.json() as Promise<Inventory>
}

export async function adjustInventory(
  token: string,
  productId: string,
  version: number,
  quantityAvailable: number,
  lowStockThreshold?: number,
): Promise<Inventory> {
  const res = await apiFetch(`${API_BASE}/api/owner/products/${productId}/inventory`, {
    method:  'PATCH',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:    JSON.stringify({
      version,
      quantityAvailable,
      ...(lowStockThreshold !== undefined ? { lowStockThreshold } : {}),
    }),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'adjust_inventory_failed')
  }
  return res.json() as Promise<Inventory>
}

// ── Stats / Dashboard ─────────────────────────────────────────────────────────

export type StatsPeriod =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'week'
  | 'month'
  | 'lastMonth'
  | 'custom'

export interface StatsRange {
  /** Preset key. Si es 'custom', usar `start`/`end` (YYYY-MM-DD). */
  period?: StatsPeriod
  start?:  string
  end?:    string
}

export interface StatsSummary {
  periodStart:     string
  periodEnd:       string
  revenue:         number
  ordersCount:     number
  deliveredCount:  number
  cancelledCount:  number
  avgTicket:       number
  fulfillmentRate: number
}

export interface TopProduct {
  productId: string
  name:      string
  unitLabel: string
  totalQty:  number
  totalRev:  number
}

function buildStatsQuery(range: StatsRange): string {
  const params = new URLSearchParams()
  if (range.period === 'custom' && range.start && range.end) {
    params.set('start', range.start)
    params.set('end',   range.end)
  } else if (range.period) {
    params.set('period', range.period)
  }
  return params.toString()
}

export async function getStatsSummary(
  token: string,
  range: StatsRange = { period: 'today' },
): Promise<StatsSummary> {
  const qs = buildStatsQuery(range)
  const res = await apiFetch(`${API_BASE}/api/owner/stats/summary?${qs}`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_stats_failed')
  return res.json() as Promise<StatsSummary>
}

export async function getTopProducts(
  token: string,
  range: StatsRange = { period: 'today' },
  limit = 5,
): Promise<TopProduct[]> {
  const qs = buildStatsQuery(range)
  const res = await apiFetch(`${API_BASE}/api/owner/stats/top-products?${qs}&limit=${limit}`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_top_products_failed')
  return res.json() as Promise<TopProduct[]>
}

export interface CoPurchasePair {
  nameA:  string
  nameB:  string
  count:  number
}

export interface WeeklyDay {
  day:     number
  label:   string
  orders:  number
  revenue: number
}

export interface StockAlert {
  productId:         string
  name:              string
  quantityAvailable: number
  lowStockThreshold: number
  status:            'out' | 'low'
}

export async function getCoPurchases(token: string): Promise<CoPurchasePair[]> {
  const res = await apiFetch(`${API_BASE}/api/owner/stats/copurchases`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_copurchases_failed')
  return res.json() as Promise<CoPurchasePair[]>
}

export async function getWeeklyTrends(token: string): Promise<WeeklyDay[]> {
  const res = await apiFetch(`${API_BASE}/api/owner/stats/weekly`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_weekly_failed')
  return res.json() as Promise<WeeklyDay[]>
}

export async function getStockAlerts(token: string): Promise<StockAlert[]> {
  const res = await apiFetch(`${API_BASE}/api/owner/stats/stock-alerts`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_stock_alerts_failed')
  return res.json() as Promise<StockAlert[]>
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface BusinessProfile {
  id:                 string
  name:               string
  slug:               string
  description:        string | null
  address:            string | null
  latitude:           number | null
  longitude:          number | null
  timezone:           string
  subscriptionStatus: string
}

export interface StaffMember {
  id:        string
  email:     string
  role:      'OWNER' | 'STAFF'
  createdAt: string
}

export interface CurrentUser {
  id:              string
  email:           string
  role:            string
  businessId:      string
  businessSlug?:   string | undefined
  emailVerifiedAt: string | null
}

export const TIMEZONES = [
  { value: 'America/Havana',        label: 'La Habana (Cuba)'      },
  { value: 'America/New_York',      label: 'Nueva York (ET)'       },
  { value: 'America/Chicago',       label: 'Chicago (CT)'          },
  { value: 'America/Mexico_City',   label: 'Ciudad de México'      },
  { value: 'America/Bogota',        label: 'Bogotá (Colombia)'     },
  { value: 'America/Lima',          label: 'Lima (Perú)'           },
  { value: 'America/Caracas',       label: 'Caracas (Venezuela)'   },
  { value: 'America/La_Paz',        label: 'La Paz (Bolivia)'      },
  { value: 'America/Guayaquil',     label: 'Guayaquil (Ecuador)'   },
  { value: 'America/Santiago',      label: 'Santiago (Chile)'      },
  { value: 'America/Buenos_Aires',  label: 'Buenos Aires'          },
  { value: 'America/Montevideo',    label: 'Montevideo (Uruguay)'  },
  { value: 'America/Asuncion',      label: 'Asunción (Paraguay)'   },
  { value: 'UTC',                   label: 'UTC'                   },
]

export async function getMe(token: string): Promise<CurrentUser> {
  const res = await apiFetch(`${API_BASE}/api/auth/owner/me`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_me_failed')
  return res.json() as Promise<CurrentUser>
}

export async function getBusinessProfile(token: string): Promise<BusinessProfile> {
  const res = await apiFetch(`${API_BASE}/api/owner/settings/business`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_business_failed')
  return res.json() as Promise<BusinessProfile>
}

export async function updateBusinessProfile(
  token: string,
  data:  { name?: string; description?: string | null; timezone?: string; address?: string | null; latitude?: number | null; longitude?: number | null },
): Promise<BusinessProfile> {
  const res = await apiFetch(`${API_BASE}/api/owner/settings/business`, {
    method:  'PATCH',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:    JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'update_business_failed')
  }
  return res.json() as Promise<BusinessProfile>
}

export async function getStaff(token: string): Promise<StaffMember[]> {
  const res = await apiFetch(`${API_BASE}/api/owner/settings/staff`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_staff_failed')
  return res.json() as Promise<StaffMember[]>
}

export async function createStaff(
  token: string,
  data:  { email: string; password: string; role?: 'OWNER' | 'STAFF' },
): Promise<StaffMember> {
  const res = await apiFetch(`${API_BASE}/api/owner/settings/staff`, {
    method:  'POST',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:    JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'create_staff_failed')
  }
  return res.json() as Promise<StaffMember>
}

export async function deleteStaff(token: string, userId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/owner/settings/staff/${userId}`, {
    method:  'DELETE',
    headers:     { ...csrfHeader() },
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'delete_staff_failed')
  }
}

export async function changePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/owner/settings/password`, {
    method:  'PATCH',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:    JSON.stringify({ currentPassword, newPassword }),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'change_password_failed')
  }
}

// ── Customers / CRM ───────────────────────────────────────────────────────────

export type CustomerSegment = 'all' | 'active' | 'vip'

export interface CustomerSummary {
  id:          string
  displayName: string | null
  telegramId:  string | null
  phone:       string | null
  createdAt:   string
  totalOrders: number
  totalSpent:  number
  lastOrderAt: string | null
  isVip:       boolean
  isActive:    boolean
}

export interface CustomerListResponse {
  total: number
  page:  number
  limit: number
  items: CustomerSummary[]
}

export interface CustomerOrderItem {
  id:        string
  name:      string
  unitLabel: string
  quantity:  number
  subtotal:  number
}

export interface CustomerOrder {
  id:          string
  status:      OrderStatus
  subtotal:    number
  pickupCode:  string | null
  confirmedAt: string | null
  pickedUpAt:  string | null
  items:       CustomerOrderItem[]
}

export interface CustomerDetail {
  customer: {
    id:          string
    displayName: string | null
    telegramId:  string | null
    phone:       string | null
    createdAt:   string
    lastLoginAt: string | null
  }
  stats: {
    totalOrders:    number
    totalSpent:     number
    lastOrderAt:    string | null
    cancelledCount: number
  }
  orders: CustomerOrder[]
}

export async function getCustomers(
  token:    string,
  segment:  CustomerSegment = 'all',
  search  = '',
  page    = 1,
  limit   = 20,
): Promise<CustomerListResponse> {
  const params = new URLSearchParams({ segment, page: String(page), limit: String(limit) })
  if (search) params.set('search', search)
  const res = await apiFetch(`${API_BASE}/api/owner/customers?${params}`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_customers_failed')
  return res.json() as Promise<CustomerListResponse>
}

export async function getCustomerDetail(
  token:      string,
  customerId: string,
): Promise<CustomerDetail> {
  const res = await apiFetch(`${API_BASE}/api/owner/customers/${customerId}`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_customer_detail_failed')
  return res.json() as Promise<CustomerDetail>
}

// ── Announcements ─────────────────────────────────────────────────────────────

export async function publishAnnouncement(
  token: string,
  text:  string,
): Promise<{ jobId: string; queue: string }> {
  const res = await apiFetch(`${API_BASE}/api/owner/announcements/publish`, {
    method:  'POST',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:    JSON.stringify({ text }),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'publish_failed')
  }
  return res.json() as Promise<{ jobId: string; queue: string }>
}

// ── Announcements v2 — persistentes con CRUD ──────────────────────────────────

export type AnnouncementStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED'

export interface Announcement {
  id:           string
  text:         string
  template:     string | null
  productIds:   string[]
  imageUrl:     string | null
  generatedPng: string | null
  scheduledAt:  string | null
  status:       AnnouncementStatus
  sentAt:       string | null
  errorMessage: string | null
  jobId:        string | null
  createdAt:    string
  updatedAt:    string
}

export interface CreateAnnouncementInput {
  text:         string
  template?:    string  | undefined
  productIds?:  string[] | undefined
  imageUrl?:    string  | undefined
  scheduledAt?: string  | undefined
  sendNow?:     boolean | undefined
}

export async function getAnnouncements(
  limit  = 50,
  status?: AnnouncementStatus,
): Promise<Announcement[]> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (status) params.set('status', status)
  const res = await apiFetch(`${API_BASE}/api/owner/announcements?${params}`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_announcements_failed')
  return res.json() as Promise<Announcement[]>
}

export async function createAnnouncement(input: CreateAnnouncementInput): Promise<Announcement> {
  const res = await apiFetch(`${API_BASE}/api/owner/announcements`, {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:        JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'create_announcement_failed')
  }
  return res.json() as Promise<Announcement>
}

export async function updateAnnouncement(
  id:    string,
  data:  Partial<Pick<CreateAnnouncementInput, 'text' | 'template' | 'productIds' | 'imageUrl' | 'scheduledAt'>>,
): Promise<Announcement> {
  const res = await apiFetch(`${API_BASE}/api/owner/announcements/${id}`, {
    method:      'PATCH',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:        JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'update_announcement_failed')
  }
  return res.json() as Promise<Announcement>
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/owner/announcements/${id}`, {
    method:      'DELETE',
    headers:     { ...csrfHeader() },
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'delete_announcement_failed')
  }
}

export async function previewAnnouncementImage(input: {
  text:        string
  template?:   string | undefined
  productIds?: string[] | undefined
}): Promise<{ url: string }> {
  const res = await apiFetch(`${API_BASE}/api/owner/announcements/preview-image`, {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:        JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string; message?: string }
    throw new Error(body.message ?? body.error ?? 'preview_failed')
  }
  return res.json() as Promise<{ url: string }>
}

export async function regenerateAnnouncementImage(id: string): Promise<Announcement> {
  const res = await apiFetch(`${API_BASE}/api/owner/announcements/${id}/regenerate-image`, {
    method:      'POST',
    headers:     { ...csrfHeader() },
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string; message?: string }
    throw new Error(body.message ?? body.error ?? 'regenerate_failed')
  }
  return res.json() as Promise<Announcement>
}

export async function sendAnnouncement(id: string): Promise<{ ok: boolean; jobId?: string }> {
  const res = await apiFetch(`${API_BASE}/api/owner/announcements/${id}/send`, {
    method:      'POST',
    headers:     { ...csrfHeader() },
    credentials: 'include',
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'send_announcement_failed')
  }
  return res.json() as Promise<{ ok: boolean; jobId?: string }>
}

export async function patchOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus,
): Promise<{ id: string; status: OrderStatus }> {
  const res = await apiFetch(`${API_BASE}/api/owner/orders/${orderId}/status`, {
    method:  'PATCH',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'patch_status_failed')
  }
  return res.json() as Promise<{ id: string; status: OrderStatus }>
}

// ── Admin (super-admin) ────────────────────────────────────────────────────────

export type BusinessStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED'

export interface AdminBusiness {
  id:                 string
  slug:               string
  name:               string
  description:        string | null
  timezone:           string
  subscriptionStatus: string
  status:             BusinessStatus
  onboardedAt:        string | null
  createdAt:          string
  stats: {
    usersCount:    number
    productsCount: number
    ordersCount:   number
    lastOrderAt:   string | null
    totalRevenue:  number
  }
}

export async function getAdminBusinesses(): Promise<AdminBusiness[]> {
  const res = await apiFetch(`${API_BASE}/api/admin/businesses`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'fetch_admin_businesses_failed')
  }
  return res.json() as Promise<AdminBusiness[]>
}

export type LeadStatus = 'NEW' | 'CONTACTED' | 'TRIAL' | 'CONVERTED' | 'LOST'

export interface Lead {
  id:           string
  email:        string
  phone:        string | null
  telegram:     string | null
  businessKind: string | null
  message:      string | null
  source:       string
  status:       LeadStatus
  notes:        string | null
  createdAt:    string
  updatedAt:    string
}

export async function getAdminLeads(): Promise<Lead[]> {
  const res = await apiFetch(`${API_BASE}/api/leads/admin-list`, {
    credentials: 'include',
    cache:       'no-store',
  })
  if (!res.ok) throw new Error('fetch_leads_failed')
  return res.json() as Promise<Lead[]>
}

export async function updateLead(
  id:    string,
  data:  { status?: LeadStatus; notes?: string },
): Promise<Lead> {
  const res = await apiFetch(`${API_BASE}/api/leads/admin-update/${id}`, {
    method:      'PATCH',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:        JSON.stringify(data),
  })
  if (!res.ok) throw new Error('update_lead_failed')
  return res.json() as Promise<Lead>
}

export async function setBusinessStatus(
  businessId: string,
  status:     BusinessStatus,
): Promise<{ id: string; slug: string; status: BusinessStatus }> {
  const res = await apiFetch(`${API_BASE}/api/admin/businesses/${businessId}/status`, {
    method:      'PATCH',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:        JSON.stringify({ status }),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'set_status_failed')
  }
  return res.json() as Promise<{ id: string; slug: string; status: BusinessStatus }>
}

// ── Telegram settings ─────────────────────────────────────────────────────────

export interface TelegramSettings {
  hasBotToken:  boolean
  channelId:    string | null
  notifyChatId: string | null
}

export interface TelegramSettingsInput {
  botToken?:     string | null
  channelId?:    string | null
  notifyChatId?: string | null
}

export async function getTelegramSettings(): Promise<TelegramSettings> {
  const res = await apiFetch(`${API_BASE}/api/owner/settings/telegram`, {
    credentials: 'include',
  })
  if (!res.ok) throw new Error('fetch_failed')
  return res.json() as Promise<TelegramSettings>
}

export async function updateTelegramSettings(input: TelegramSettingsInput): Promise<void> {
  const res = await apiFetch(`${API_BASE}/api/owner/settings/telegram`, {
    method:      'PATCH',
    headers:     { 'Content-Type': 'application/json', ...csrfHeader() },
    credentials: 'include',
    body:        JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'update_failed')
  }
}
