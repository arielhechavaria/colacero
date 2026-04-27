import type { OrderStatus, NotificationStatus } from './enums.js'

export interface PickupWindow {
  id:          string
  businessId:  string
  date:        string   // ISO date YYYY-MM-DD
  startTime:   string   // 'HH:MM'
  endTime:     string   // 'HH:MM'
  capacity:    number
  ordersCount: number
  isOpen:      boolean
}

export interface OrderItem {
  id:                string
  orderId:           string
  productId:         string
  quantity:          number
  unitPriceSnapshot: number
  subtotal:          number
}

export interface Order {
  id:             string
  businessId:     string
  customerId:     string
  pickupWindowId: string | null
  status:         OrderStatus
  subtotal:       number
  pickupCode:     string | null   // 6 chars alfanumérico
  notes?:         string
  createdAt:      Date
  confirmedAt?:   Date
  readyAt?:       Date
  pickedUpAt?:    Date
  expiresAt?:     Date
  items?:         OrderItem[]
}

export interface Notification {
  id:           string
  orderId:      string
  channel:      'whatsapp'
  templateName: string
  payload:      Record<string, unknown>
  status:       NotificationStatus
  sentAt?:      Date
  errorMessage?: string
  retryCount:   number
}

// ── Payloads de API ────────────────────────────────────────────────────────
export interface CreateDraftOrderPayload {
  customerId:     string
  pickupWindowId: string
  items: Array<{ productId: string; quantity: number }>
  notes?: string
}

export interface ConfirmOrderPayload {
  otpCode: string
}
