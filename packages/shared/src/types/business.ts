import type { SubscriptionStatus } from './enums.js'

export interface Business {
  id:                 string
  slug:               string
  name:               string
  description?:       string
  timezone:           string
  subscriptionStatus: SubscriptionStatus
  createdAt:          Date
  updatedAt:          Date
}

export interface User {
  id:           string
  businessId:   string
  email:        string
  passwordHash: string
  role:         import('./enums.js').UserRole
  createdAt:    Date
}

export interface Customer {
  id:          string
  telegramId?: string | null
  phone?:      string | null   // e164: +5355123456 — fallback OTP
  displayName?: string | null
  lastLoginAt?: Date | null
  createdAt:   Date
}
