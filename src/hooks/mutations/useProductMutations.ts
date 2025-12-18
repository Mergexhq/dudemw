import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ProductService } from '@/lib/services/products'
import { productKeys } from '../queries/useProducts'
import { toast } from 'sonner'

/**
 * Mutation hook for creating a product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productData: any) => {
      const result = await ProductService.createProduct(productData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to create product')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Product created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create product')
    },
  })
}

/**
 * Mutation hook for updating a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, updates }: { productId: string; updates: any }) => {
      const result = await ProductService.updateProduct(productId, updates)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update product')
      }
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) })
      toast.success('Product updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update product')
    },
  })
}

/**
 * Mutation hook for deleting a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await ProductService.deleteProduct(productId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to delete product')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Product deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete product')
    },
  })
}

/**
 * Mutation hook for duplicating a product
 */
export function useDuplicateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const result = await ProductService.duplicateProduct(productId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to duplicate product')
      }
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('Product duplicated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to duplicate product')
    },
  })
}

/**
 * Mutation hook for updating product SEO
 */
export function useUpdateProductSEO() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ productId, seoData }: { productId: string; seoData: any }) => {
      const result = await ProductService.updateProductSEO(productId, seoData)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update product SEO')
      }
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.productId) })
      queryClient.invalidateQueries({ queryKey: productKeys.seo(variables.productId) })
      toast.success('SEO updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update SEO')
    },
  })
}
