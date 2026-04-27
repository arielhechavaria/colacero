import { describe, it, expect, vi } from 'vitest'
import { updateInventoryOptimistic } from '../../services/inventory.service.js'

describe('inventory.service — updateInventoryOptimistic', () => {
  it('ol-success: count=1 → success=true', async () => {
    const prisma = {
      inventory: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    } as any
    const result = await updateInventoryOptimistic(prisma, 'prod1', 0, { quantityAvailable: 10 })
    expect(result.success).toBe(true)
  })

  it('ol-conflict: count=0 → success=false (versión obsoleta)', async () => {
    const prisma = {
      inventory: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    } as any
    const result = await updateInventoryOptimistic(prisma, 'prod1', 99, { quantityAvailable: 10 })
    expect(result.success).toBe(false)
  })

  it('ol-increments-version: llama updateMany con version: { increment: 1 }', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    const prisma = { inventory: { updateMany } } as any

    await updateInventoryOptimistic(prisma, 'prod1', 0, { quantityAvailable: 5 })

    expect(updateMany).toHaveBeenCalledWith({
      where: { productId: 'prod1', version: 0 },
      data:  { quantityAvailable: 5, version: { increment: 1 } },
    })
  })

  it('ol-multiple-fields: pasa todos los campos de updates', async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 })
    const prisma = { inventory: { updateMany } } as any

    await updateInventoryOptimistic(prisma, 'prod2', 3, {
      quantityAvailable: 20,
      quantityReserved:  5,
      lowStockThreshold: 10,
    })

    expect(updateMany).toHaveBeenCalledWith({
      where: { productId: 'prod2', version: 3 },
      data:  {
        quantityAvailable: 20,
        quantityReserved:  5,
        lowStockThreshold: 10,
        version: { increment: 1 },
      },
    })
  })
})
