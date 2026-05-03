const API_BASE = ''

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface TelegramAuthResult {
  token:    string
  customer: { id: string; telegramId: string | null; displayName: string | null }
}

export async function telegramAuth(initData: string): Promise<TelegramAuthResult> {
  const res = await fetch(`${API_BASE}/api/auth/customer/telegram`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ initData }),
  })
  if (!res.ok) {
    const body = await res.json() as { error: string }
    throw new Error(body.error ?? 'telegram_auth_failed')
  }
  return res.json() as Promise<TelegramAuthResult>
}

export async function requestOtp(phone: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE}/api/auth/customer/request-otp`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ phone }),
  })
  if (!res.ok) {
    const body = await res.json() as { error: string }
    throw new Error(body.error ?? 'request_otp_failed')
  }
  return res.json() as Promise<{ ok: boolean }>
}

export interface VerifyOtpResult {
  token:    string
  customer: { id: string; phone: string }
}

export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResult> {
  const res = await fetch(`${API_BASE}/api/auth/customer/verify-otp`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ phone, otp }),
  })
  if (!res.ok) {
    const body = await res.json() as { error: string }
    throw new Error(body.error ?? 'verify_otp_failed')
  }
  return res.json() as Promise<VerifyOtpResult>
}

// ── Pickup windows ────────────────────────────────────────────────────────────

export interface PickupWindow {
  id:          string
  date:        string
  startTime:   string
  endTime:     string
  capacity:    number
  ordersCount: number
  spotsLeft:   number
}

export async function getPickupWindows(slug: string): Promise<PickupWindow[]> {
  const res = await fetch(`${API_BASE}/api/catalog/${slug}/pickup-windows`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error('pickup_windows_failed')
  return res.json() as Promise<PickupWindow[]>
}

// ── Stock reservation ─────────────────────────────────────────────────────────

export interface ReserveResult {
  reservationId: string
  expiresAt:     string
}

export async function reserveStock(productId: string, quantity: number): Promise<ReserveResult> {
  const res = await fetch(`${API_BASE}/api/cart/reserve`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ productId, quantity }),
  })
  if (!res.ok) {
    const body = await res.json() as { error: string }
    throw new Error(body.error ?? 'reserve_failed')
  }
  return res.json() as Promise<ReserveResult>
}

// ── Checkout ──────────────────────────────────────────────────────────────────

export interface CheckoutInput {
  pickupWindowId: string
  reservationIds: string[]
  customerName?:  string
  notes?:         string
}

export interface CheckoutResult {
  orderId:     string
  pickupCode:  string
  subtotal:    number
  items:       Array<{ productId: string; name: string; quantity: number; unitPrice: number; subtotal: number }>
  pickupWindow: { id: string; date: string; startTime: string; endTime: string }
}

export async function checkout(input: CheckoutInput, token: string): Promise<CheckoutResult> {
  const res = await fetch(`${API_BASE}/api/cart/checkout`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const body = await res.json() as { error: string }
    throw new Error(body.error ?? 'checkout_failed')
  }
  return res.json() as Promise<CheckoutResult>
}

// ── Order ─────────────────────────────────────────────────────────────────────

export interface OrderItem {
  id:                string
  productId:         string
  name:              string
  unitLabel:         string
  quantity:          number
  unitPriceSnapshot: number
  subtotal:          number
}

export interface OrderDetail {
  id:          string
  pickupCode:  string | null
  status:      string
  subtotal:    number
  confirmedAt: string | null
  business:    { id: string; name: string; slug: string }
  pickupWindow: { id: string; date: string; startTime: string; endTime: string } | null
  items:        OrderItem[]
}

export async function getOrder(orderId: string, token: string): Promise<OrderDetail> {
  const res = await fetch(`${API_BASE}/api/cart/order/${orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
    cache:   'no-store',
  })
  if (!res.ok) {
    const body = await res.json() as { error: string }
    throw new Error(body.error ?? 'order_not_found')
  }
  return res.json() as Promise<OrderDetail>
}

// ── Public order tracking ─────────────────────────────────────────────────────

export interface TrackingItem {
  id:        string
  name:      string
  unitLabel: string
  quantity:  number
  subtotal:  number
}

export interface TrackingOrder {
  id:          string
  pickupCode:  string | null
  status:      string
  subtotal:    number
  confirmedAt: string | null
  notes:       string | null
  business:    { id: string; name: string; slug: string }
  pickupWindow: { id: string; date: string; startTime: string; endTime: string } | null
  items:        TrackingItem[]
}

export async function getOrderByCode(slug: string, code: string): Promise<TrackingOrder> {
  const res = await fetch(`${API_BASE}/api/catalog/${slug}/order/${code}`, {
    cache: 'no-store',
  })
  if (!res.ok) {
    const body = await res.json() as { error: string }
    throw new Error(body.error ?? 'order_not_found')
  }
  return res.json() as Promise<TrackingOrder>
}
