import type { PrismaClient } from '@colacero/db'

export interface InventoryUpdate {
  quantityAvailable?: number
  quantityReserved?:  number
  lowStockThreshold?: number
}

/**
 * Actualiza el inventario de un producto con optimistic locking.
 * Falla silenciosamente (success=false) si la versión no coincide.
 */
export async function updateInventoryOptimistic(
  prisma:    PrismaClient,
  productId: string,
  version:   number,
  updates:   InventoryUpdate,
): Promise<{ success: boolean }> {
  const result = await prisma.inventory.updateMany({
    where: { productId, version },
    data:  { ...updates, version: { increment: 1 } },
  })
  return { success: result.count > 0 }
}
