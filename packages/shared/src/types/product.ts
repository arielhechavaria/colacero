export interface Product {
  id:          string
  businessId:  string
  sku?:        string
  name:        string
  description?: string
  unitPrice:   number   // en la moneda local
  unitLabel:   string   // 'kg' | 'unidad' | 'caja' | etc.
  imageUrl?:   string
  isActive:    boolean
  createdAt:   Date
  updatedAt:   Date
}

export interface Inventory {
  productId:          string
  quantityAvailable:  number
  quantityReserved:   number
  lowStockThreshold:  number
  version:            number  // optimistic locking
  updatedAt:          Date
}

export type ProductWithInventory = Product & { inventory: Inventory | null }
