export enum OrderStatus {
  DRAFT     = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY     = 'READY',
  PICKED_UP = 'PICKED_UP',
  CANCELLED = 'CANCELLED',
  EXPIRED   = 'EXPIRED',
}

export enum UserRole {
  OWNER = 'OWNER',
  STAFF = 'STAFF',
}

export enum SubscriptionStatus {
  TRIAL     = 'TRIAL',
  ACTIVE    = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT    = 'SENT',
  FAILED  = 'FAILED',
}

export enum WhatsAppProvider {
  META_CLOUD = 'meta-cloud',
  MOCK       = 'mock',
}
