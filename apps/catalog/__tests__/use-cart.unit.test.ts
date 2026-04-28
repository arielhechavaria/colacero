import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCart } from '../hooks/use-cart'

const PRODUCT = {
  productId: 'prod-1',
  name:      'Pollo',
  unitPrice: '350.00',
  unitLabel: 'lb',
}

const PRODUCT_2 = {
  productId: 'prod-2',
  name:      'Arroz',
  unitPrice: '45.00',
  unitLabel: 'libra',
}

describe('useCart', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('add: agrega item al carrito con quantity 1', () => {
    const { result } = renderHook(() => useCart())

    act(() => { result.current.add(PRODUCT) })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({ ...PRODUCT, quantity: 1 })
  })

  it('add-twice: incrementa quantity en lugar de duplicar', () => {
    const { result } = renderHook(() => useCart())

    act(() => { result.current.add(PRODUCT) })
    act(() => { result.current.add(PRODUCT) })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]?.quantity).toBe(2)
  })

  it('remove: decrementa quantity; elimina si llega a 0', () => {
    const { result } = renderHook(() => useCart())

    act(() => { result.current.add(PRODUCT) })
    act(() => { result.current.add(PRODUCT) })
    act(() => { result.current.remove(PRODUCT.productId) })
    expect(result.current.items[0]?.quantity).toBe(1)

    act(() => { result.current.remove(PRODUCT.productId) })
    expect(result.current.items).toHaveLength(0)
  })

  it('clear: vacía el carrito', () => {
    const { result } = renderHook(() => useCart())

    act(() => { result.current.add(PRODUCT) })
    act(() => { result.current.add(PRODUCT_2) })
    act(() => { result.current.clear() })

    expect(result.current.items).toHaveLength(0)
  })

  it('total: calcula el total correctamente', () => {
    const { result } = renderHook(() => useCart())

    act(() => { result.current.add(PRODUCT) })   // 350 × 1
    act(() => { result.current.add(PRODUCT) })   // 350 × 2
    act(() => { result.current.add(PRODUCT_2) }) // 45 × 1

    // 350*2 + 45*1 = 745
    expect(result.current.total).toBeCloseTo(745)
  })
})
