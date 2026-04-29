'use client'

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3000'

// ── Auth ──────────────────────────────────────────────────────────────────────

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
