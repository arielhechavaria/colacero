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
