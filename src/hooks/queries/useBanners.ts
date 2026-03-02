import { useQuery, UseQueryOptions } from '@tanstack/react-query'

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
 * Hook to fetch banners list and stats
 * Uses fetch to /api/admin/banners to avoid pulling BannerService (db.ts/cloudinary) into the client bundle
 */
export function useBanners(
  filters?: any,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: bannerKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.placement) params.set('placement', filters.placement)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.category) params.set('category', filters.category)

      const [bannersRes, statsRes] = await Promise.all([
        fetch(`/api/admin/banners?${params.toString()}`),
        fetch('/api/admin/banners/stats'),
      ])

      if (!bannersRes.ok) {
        const err = await bannersRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch banners')
      }

      const banners = await bannersRes.json()
      const statsJson = statsRes.ok ? await statsRes.json().catch(() => null) : null

      return {
        banners: banners || [],
        stats: statsJson || undefined,
      }
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
      const res = await fetch(`/api/admin/banners/${bannerId}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch banner')
      }
      return res.json()
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
      const res = await fetch(`/api/admin/banners/${bannerId}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch banner stats')
      }
      const data = await res.json()
      return {
        total: 1,
        active: data.status === 'active' ? 1 : 0,
        scheduled: data.status === 'scheduled' ? 1 : 0,
        expired: data.status === 'expired' ? 1 : 0,
        disabled: data.status === 'disabled' ? 1 : 0,
        totalClicks: data.clicks || 0,
        totalImpressions: data.impressions || 0,
        averageCTR: parseFloat(String(data.ctr || 0)),
      }
    },
    enabled: !!bannerId,
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}
