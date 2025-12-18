import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { CategoryService } from '@/lib/services/categories'

/**
 * Query keys for categories
 */
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters?: any) => [...categoryKeys.lists(), filters] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
  stats: () => [...categoryKeys.all, 'stats'] as const,
}

/**
 * Hook to fetch categories list
 */
export function useCategories(
  filters?: any,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: categoryKeys.list(filters),
    queryFn: async () => {
      const result = await CategoryService.getCategories(filters)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch categories')
      }
      return result.data
    },
    ...options,
  })
}

/**
 * Hook to fetch category details by ID
 */
export function useCategory(
  categoryId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: categoryKeys.detail(categoryId),
    queryFn: async () => {
      const result = await CategoryService.getCategory(categoryId)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch category')
      }
      return result.data
    },
    enabled: !!categoryId,
    ...options,
  })
}

/**
 * Hook to fetch category statistics
 */
export function useCategoryStats(
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: categoryKeys.stats(),
    queryFn: async () => {
      const result = await CategoryService.getCategoryStats()
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch category stats')
      }
      return result.data
    },
    staleTime: 5 * 60 * 1000, // Stats are stale after 5 minutes
    ...options,
  })
}
