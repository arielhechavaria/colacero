'use client'

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'

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
