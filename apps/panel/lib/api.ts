'use client'

// URLs relativas — Next.js reescribe /api/* hacia el servicio API via rewrites()
const API_BASE = ''

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

export async function loginOwner(
  email: string,
  password: string,
): Promise<{ token: string }> {
  const res = await fetch(`${API_BASE}/api/auth/owner/login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'login_failed')
  }
  return res.json() as Promise<{ token: string }>
}

// ── Orders ────────────────────────────────────────────────────────────────────

export async function getOrders(token: string, date?: string): Promise<DayOrders> {
  const url = date
    ? `${API_BASE}/api/owner/orders?date=${date}`
    : `${API_BASE}/api/owner/orders`

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
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
  const res = await fetch(`${API_BASE}/api/owner/pickup-windows`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
  })
  if (!res.ok) throw new Error('fetch_windows_failed')
  return res.json() as Promise<PickupWindow[]>
}

export async function createWindow(
  token: string,
  input: CreateWindowInput,
): Promise<PickupWindow> {
  const res = await fetch(`${API_BASE}/api/owner/pickup-windows`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
  const res = await fetch(`${API_BASE}/api/owner/pickup-windows/${windowId}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body:    JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'patch_window_failed')
  }
  return res.json() as Promise<PickupWindow>
}

export async function deleteWindow(token: string, windowId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/owner/pickup-windows/${windowId}`, {
    method:  'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'delete_window_failed')
  }
}

export async function generateTomorrow(
  token: string,
): Promise<{ date: string; created: PickupWindow[] }> {
  const res = await fetch(`${API_BASE}/api/owner/pickup-windows/generate-tomorrow`, {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'generate_tomorrow_failed')
  }
  return res.json() as Promise<{ date: string; created: PickupWindow[] }>
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
  initialQuantity?:   number
  lowStockThreshold?: number
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'initialQuantity'> & { isActive: boolean }>

export async function getProducts(token: string): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/api/owner/products`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
  })
  if (!res.ok) throw new Error('fetch_products_failed')
  const data = await res.json() as { products: Product[] } | Product[]
  return Array.isArray(data) ? data : data.products
}

export async function createProduct(
  token: string,
  input: CreateProductInput,
): Promise<Product> {
  const res = await fetch(`${API_BASE}/api/owner/products`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
  const res = await fetch(`${API_BASE}/api/owner/products/${productId}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body:    JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'update_product_failed')
  }
  return res.json() as Promise<Product>
}

export async function deleteProduct(token: string, productId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/owner/products/${productId}`, {
    method:  'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'delete_product_failed')
  }
}

export async function getInventory(token: string, productId: string): Promise<Inventory> {
  const res = await fetch(`${API_BASE}/api/owner/products/${productId}/inventory`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
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
  const res = await fetch(`${API_BASE}/api/owner/products/${productId}/inventory`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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

export type StatsPeriod = 'today' | 'week' | 'month'

export interface StatsSummary {
  period:          StatsPeriod
  periodStart:     string
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

export async function getStatsSummary(
  token: string,
  period: StatsPeriod = 'today',
): Promise<StatsSummary> {
  const res = await fetch(`${API_BASE}/api/owner/stats/summary?period=${period}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
  })
  if (!res.ok) throw new Error('fetch_stats_failed')
  return res.json() as Promise<StatsSummary>
}

export async function getTopProducts(
  token: string,
  period: StatsPeriod = 'today',
  limit = 5,
): Promise<TopProduct[]> {
  const res = await fetch(`${API_BASE}/api/owner/stats/top-products?period=${period}&limit=${limit}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
  })
  if (!res.ok) throw new Error('fetch_top_products_failed')
  return res.json() as Promise<TopProduct[]>
}

// ── Settings ──────────────────────────────────────────────────────────────────

export interface BusinessProfile {
  id:                 string
  name:               string
  slug:               string
  description:        string | null
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
  id:         string
  email:      string
  role:       string
  businessId: string
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
  const res = await fetch(`${API_BASE}/api/auth/owner/me`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
  })
  if (!res.ok) throw new Error('fetch_me_failed')
  return res.json() as Promise<CurrentUser>
}

export async function getBusinessProfile(token: string): Promise<BusinessProfile> {
  const res = await fetch(`${API_BASE}/api/owner/settings/business`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
  })
  if (!res.ok) throw new Error('fetch_business_failed')
  return res.json() as Promise<BusinessProfile>
}

export async function updateBusinessProfile(
  token: string,
  data:  { name?: string; description?: string | null; timezone?: string },
): Promise<BusinessProfile> {
  const res = await fetch(`${API_BASE}/api/owner/settings/business`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body:    JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'update_business_failed')
  }
  return res.json() as Promise<BusinessProfile>
}

export async function getStaff(token: string): Promise<StaffMember[]> {
  const res = await fetch(`${API_BASE}/api/owner/settings/staff`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
  })
  if (!res.ok) throw new Error('fetch_staff_failed')
  return res.json() as Promise<StaffMember[]>
}

export async function createStaff(
  token: string,
  data:  { email: string; password: string; role?: 'OWNER' | 'STAFF' },
): Promise<StaffMember> {
  const res = await fetch(`${API_BASE}/api/owner/settings/staff`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body:    JSON.stringify(data),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'create_staff_failed')
  }
  return res.json() as Promise<StaffMember>
}

export async function deleteStaff(token: string, userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/owner/settings/staff/${userId}`, {
    method:  'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
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
  const res = await fetch(`${API_BASE}/api/owner/settings/password`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
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
  const res = await fetch(`${API_BASE}/api/owner/customers?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
  })
  if (!res.ok) throw new Error('fetch_customers_failed')
  return res.json() as Promise<CustomerListResponse>
}

export async function getCustomerDetail(
  token:      string,
  customerId: string,
): Promise<CustomerDetail> {
  const res = await fetch(`${API_BASE}/api/owner/customers/${customerId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
  })
  if (!res.ok) throw new Error('fetch_customer_detail_failed')
  return res.json() as Promise<CustomerDetail>
}

// ── Announcements ─────────────────────────────────────────────────────────────

export async function publishAnnouncement(
  token: string,
  text:  string,
): Promise<{ jobId: string; queue: string }> {
  const res = await fetch(`${API_BASE}/api/owner/announcements`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body:    JSON.stringify({ text }),
  })
  if (!res.ok) {
    const body = await res.json() as { error?: string }
    throw new Error(body.error ?? 'publish_failed')
  }
  return res.json() as Promise<{ jobId: string; queue: string }>
}

export async function patchOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus,
): Promise<{ id: string; status: OrderStatus }> {
  const res = await fetch(`${API_BASE}/api/owner/orders/${orderId}/status`, {
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
