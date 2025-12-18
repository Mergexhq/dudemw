import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { ProductService } from '@/lib/services/products'

/**
 * Query keys for products
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters?: any) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  analytics: (id: string) => [...productKeys.all, 'analytics', id] as const,
  seo: (id: string) => [...productKeys.all, 'seo', id] as const,
}

/**
 * Hook to fetch products list
 */
export function useProducts(
  filters?: any,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: async () => {
      const result = await ProductService.getProducts(filters)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch products')
      }
      return result.data
    },
    ...options,
  })
}

/**
 * Hook to fetch product details by ID
 */
export function useProduct(
  productId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: productKeys.detail(productId),
    queryFn: async () => {
      const result = await ProductService.getProduct(productId)
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch product')
      }
      return result.data
    },
    enabled: !!productId,
    ...options,
  })
}

/**
 * Hook to fetch product analytics
 */
export function useProductAnalytics(
  productId: string,
  options?: Omit<UseQueryOptions<any, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: productKeys.analytics(productId),
    queryFn: async () => {
      const result = await ProductService.getProductAnalytics(productId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch product analytics')
      }
      return result.data
    },
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // Analytics stale after 5 minutes
    ...options,
  })
}
