import { useQuery, UseQueryOptions } from '@tanstack/react-query'
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
 * Calls /api/admin/inventory to avoid pulling server-only modules into the client bundle
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
      const params = new URLSearchParams()
      if (filters.search) params.set('search', filters.search)
      if (filters.stockStatus) params.set('stockStatus', filters.stockStatus)
      params.set('page', String(page))
      params.set('limit', String(limit))

      const res = await fetch(`/api/admin/inventory?${params.toString()}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch inventory')
      }
      const json = await res.json()
      return json.data
    },
    ...options,
  })
}

/**
 * Hook to fetch inventory statistics
 * Calls /api/admin/inventory/stats to avoid pulling server-only modules into the client bundle
 */
export function useInventoryStats(
  options?: Omit<UseQueryOptions<InventoryStats, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: inventoryKeys.stats(),
    queryFn: async () => {
      const res = await fetch('/api/admin/inventory/stats')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch inventory stats')
      }
      const json = await res.json()
      if (!json.stats) throw new Error('Failed to fetch inventory stats')
      return json.stats as InventoryStats
    },
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch low stock alerts
 * Calls /api/admin/inventory/stats to avoid pulling server-only modules into the client bundle
 */
export function useLowStockAlerts(
  options?: Omit<UseQueryOptions<any[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: async () => {
      const res = await fetch('/api/admin/inventory/stats')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch low stock alerts')
      }
      const json = await res.json()
      return json.lowStockAlerts || []
    },
    staleTime: 1 * 60 * 1000,
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
      const res = await fetch(`/api/admin/inventory/history/${productId}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch inventory history')
      }
      const json = await res.json()
      return json.data || []
    },
    enabled: !!productId,
    ...options,
  })
}
