import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { InventoryService } from '@/lib/services/inventory'
import { InventoryFilters, InventoryStats } from '@/lib/types/inventory'

/**
 * Query keys for inventory
 */
export const inventoryKeys = {
  all: ['inventory'] as const,
  lists: () => [...inventoryKeys.all, 'list'] as const,
  list: (filters: InventoryFilters, page: number) =>
    [...inventoryKeys.lists(), filters, page] as const,
  stats: () => [...inventoryKeys.all, 'stats'] as const,
  lowStock: () => [...inventoryKeys.all, 'low-stock'] as const,
  history: (productId: string) => [...inventoryKeys.all, 'history', productId] as const,
}

/**
 * Hook to fetch inventory items with filters and pagination
 */
export function useInventory(
  filters: InventoryFilters = { stockStatus: 'all' },
  page: number = 1,
  limit: number = 50,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: inventoryKeys.list(filters, page),
    queryFn: async () => {
      const result = await InventoryService.getInventoryItems(filters, page, limit)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch inventory')
      }
      return result.data
    },
    ...options,
  })
}

/**
 * Hook to fetch inventory statistics
 */
export function useInventoryStats(
  options?: Omit<UseQueryOptions<InventoryStats, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: inventoryKeys.stats(),
    queryFn: async () => {
      const result = await InventoryService.getInventoryStats()
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch inventory stats')
      }
      return result.data
    },
    staleTime: 2 * 60 * 1000, // Stats are stale after 2 minutes
    ...options,
  })
}

/**
 * Hook to fetch low stock alerts
 */
export function useLowStockAlerts(
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: async () => {
      const result = await InventoryService.getLowStockAlerts()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch low stock alerts')
      }
      return result.data || []
    },
    staleTime: 1 * 60 * 1000, // Refresh alerts every minute
    ...options,
  })
}

/**
 * Hook to fetch inventory history for a product
 */
export function useInventoryHistory(
  productId: string,
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: inventoryKeys.history(productId),
    queryFn: async () => {
      const result = await InventoryService.getInventoryHistory(productId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch inventory history')
      }
      return result.data || []
    },
    enabled: !!productId,
    ...options,
  })
}
