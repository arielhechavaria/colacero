'use client'

import { useReducer, useEffect } from 'react'

export interface CartItem {
  productId: string
  name: string
  unitPrice: string
  unitLabel: string
  quantity: number
}

type CartAction =
  | { type: 'ADD'; item: Omit<CartItem, 'quantity'> }
  | { type: 'REMOVE'; productId: string }
  | { type: 'CLEAR' }

export interface CartState {
  items: CartItem[]
}

const STORAGE_KEY = 'colacero_cart'

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.productId === action.item.productId)
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.productId === action.item.productId
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          ),
        }
      }
      return { items: [...state.items, { ...action.item, quantity: 1 }] }
    }
    case 'REMOVE': {
      const existing = state.items.find((i) => i.productId === action.productId)
      if (!existing) return state
      if (existing.quantity === 1) {
        return { items: state.items.filter((i) => i.productId !== action.productId) }
      }
      return {
        items: state.items.map((i) =>
          i.productId === action.productId
            ? { ...i, quantity: i.quantity - 1 }
            : i,
        ),
      }
    }
    case 'CLEAR':
      return { items: [] }
  }
}

function loadFromStorage(): CartState {
  if (typeof window === 'undefined') return { items: [] }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { items: [] }
    return JSON.parse(raw) as CartState
  } catch {
    return { items: [] }
  }
}

export function useCart() {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadFromStorage)

  // Sync to localStorage on every change
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const total = state.items.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0,
  )

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0)

  return {
    items: state.items,
    total,
    itemCount,
    add:   (item: Omit<CartItem, 'quantity'>) => dispatch({ type: 'ADD', item }),
    remove:(productId: string) => dispatch({ type: 'REMOVE', productId }),
    clear: () => dispatch({ type: 'CLEAR' }),
  }
}
