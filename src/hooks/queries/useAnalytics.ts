import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { AnalyticsService } from '@/lib/services/analytics'

/**
 * Query keys for analytics
 */
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsKeys.all, 'dashboard'] as const,
  revenue: (period: string) => [...analyticsKeys.all, 'revenue', period] as const,
  orders: (period: string) => [...analyticsKeys.all, 'orders', period] as const,
  topProducts: (limit: number) => [...analyticsKeys.all, 'top-products', limit] as const,
  categoryPerformance: () => [...analyticsKeys.all, 'category-performance'] as const,
  customerGrowth: () => [...analyticsKeys.all, 'customer-growth'] as const,
}

/**
 * Hook to fetch dashboard analytics
 */
export function useDashboardAnalytics(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: async () => {
      const result = await AnalyticsService.getDashboardAnalytics()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard analytics')
      }
      return result.data
    },
    staleTime: 2 * 60 * 1000, // Analytics are stale after 2 minutes
    ...options,
  })
}

/**
 * Hook to fetch revenue data
 */
export function useRevenueData(
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.revenue(period),
    queryFn: async () => {
      const result = await AnalyticsService.getRevenueData(period)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch revenue data')
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch orders data
 */
export function useOrdersData(
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.orders(period),
    queryFn: async () => {
      const result = await AnalyticsService.getOrdersData(period)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch orders data')
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch top products
 */
export function useTopProducts(
  limit: number = 5,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.topProducts(limit),
    queryFn: async () => {
      const result = await AnalyticsService.getTopProducts(limit)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch top products')
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/**
 * Hook to fetch category performance
 */
export function useCategoryPerformance(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: analyticsKeys.categoryPerformance(),
    queryFn: async () => {
      const result = await AnalyticsService.getCategoryPerformance()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch category performance')
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
