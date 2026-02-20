import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { getOrders, getOrder, getOrderStats } from '@/lib/actions/orders'

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
  page: number = 1,
  limit: number = 20,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: orderKeys.list({ ...filters, page, limit }),
    queryFn: async () => {
      const result = await getOrders(filters, page, limit)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch orders')
      }
      // Return both data and pagination info
      return { orders: result.data, pagination: result.pagination }
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
      const result = await getOrder(orderId)
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
      const result = await getOrderStats()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch order stats')
      }
      return result.data
    },
    staleTime: 2 * 60 * 1000, // Stats are stale after 2 minutes
    ...options,
  })
}
