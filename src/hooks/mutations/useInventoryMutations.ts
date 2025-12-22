import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InventoryService } from '@/lib/services/inventory'
import { CSVService } from '@/lib/services/csv'
import { inventoryKeys } from '../queries/useInventory'
import { toast } from 'sonner'

/**
 * Mutation hook for adjusting stock
 */
export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      productId,
      variantId,
      quantity,
      reason,
      notes,
    }: {
      productId: string
      variantId?: string | null
      quantity: number
      reason: string
      notes?: string
    }) => {
      const result = await InventoryService.adjustStock({
        variant_id: variantId || productId,
        quantity,
        reason,
        adjust_type: quantity >= 0 ? 'add' : 'subtract'
      })
      if (!result.success) {
        throw new Error(result.error || 'Failed to adjust stock')
      }
      return result
    },
    onSuccess: () => {
      // Invalidate inventory queries
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lowStock() })
      toast.success('Stock adjusted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to adjust stock')
    },
  })
}

/**
 * Mutation hook for bulk stock adjustment
 */
export function useBulkAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (adjustments: any[]) => {
      const result = await InventoryService.bulkAdjustStock({ adjustments })
      if (!result.success) {
        throw new Error(result.error || 'Failed to bulk adjust stock')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() })
      toast.success('Bulk stock adjustment completed')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to bulk adjust stock')
    },
  })
}

/**
 * Mutation hook for importing inventory from CSV
 */
export function useImportInventory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text()
      const result = await CSVService.parseInventoryCSV(text)
      if (!result.success) {
        throw new Error(result.error || 'Failed to parse CSV')
      }
      
      // Now bulk adjust the stock
      const bulkResult = await InventoryService.bulkAdjustStock(result.data || [])
      if (!bulkResult.success) {
        throw new Error(bulkResult.error || 'Failed to import inventory')
      }
      
      return bulkResult
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() })
      toast.success('Inventory imported successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to import inventory')
    },
  })
}

/**
 * Mutation hook for exporting inventory to CSV
 */
export function useExportInventory() {
  return useMutation({
    mutationFn: async () => {
      const result = await CSVService.exportInventoryCSV()
      if (!result.success) {
        throw new Error(result.error || 'Failed to export inventory')
      }
      return result
    },
    onSuccess: () => {
      toast.success('Inventory exported successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export inventory')
    },
  })
}
