import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { OrderService } from '@/lib/services/orders'

/**
 * Query keys for orders
 */
export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  list: (filters?: any) => [...orderKeys.lists(), filters] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
  stats: () => [...orderKeys.all, 'stats'] as const,
}

/**
 * Hook to fetch orders list
 */
export function useOrders(
  filters?: any,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: async () => {
      const result = await OrderService.getOrders(filters)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch orders')
      }
      return result.data
    },
    ...options,
  })
}

/**
 * Hook to fetch order details by ID
 */
export function useOrder(
  orderId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: orderKeys.detail(orderId),
    queryFn: async () => {
      const result = await OrderService.getOrder(orderId)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch order')
      }
      return result.data
    },
    enabled: !!orderId,
    ...options,
  })
}

/**
 * Hook to fetch order statistics
 */
export function useOrderStats(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: orderKeys.stats(),
    queryFn: async () => {
      const result = await OrderService.getOrderStats()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch order stats')
      }
      return result.data
    },
    staleTime: 2 * 60 * 1000, // Stats are stale after 2 minutes
    ...options,
  })
}
