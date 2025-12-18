import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { BannerService } from '@/lib/services/banners'

/**
 * Query keys for banners
 */
export const bannerKeys = {
  all: ['banners'] as const,
  lists: () => [...bannerKeys.all, 'list'] as const,
  list: (filters?: any) => [...bannerKeys.lists(), filters] as const,
  details: () => [...bannerKeys.all, 'detail'] as const,
  detail: (id: string) => [...bannerKeys.details(), id] as const,
  stats: (id: string) => [...bannerKeys.all, 'stats', id] as const,
}

/**
 * Hook to fetch banners list
 */
export function useBanners(
  filters?: any,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: bannerKeys.list(filters),
    queryFn: async () => {
      const result = await BannerService.getBanners(filters)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch banners')
      }
      return result.data
    },
    ...options,
  })
}

/**
 * Hook to fetch banner details by ID
 */
export function useBanner(
  bannerId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: bannerKeys.detail(bannerId),
    queryFn: async () => {
      const result = await BannerService.getBanner(bannerId)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch banner')
      }
      return result.data
    },
    enabled: !!bannerId,
    ...options,
  })
}

/**
 * Hook to fetch banner statistics
 */
export function useBannerStats(
  bannerId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: bannerKeys.stats(bannerId),
    queryFn: async () => {
      const result = await BannerService.getBannerStats(bannerId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch banner stats')
      }
      return result.data
    },
    enabled: !!bannerId,
    staleTime: 5 * 60 * 1000, // Stats are stale after 5 minutes
    ...options,
  })
}
