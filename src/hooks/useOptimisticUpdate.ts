/**
 * Optimistic UI Update Hook
 * Makes admin actions feel instant by updating UI before server response
 * Automatically rolls back on error
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'

interface OptimisticUpdateOptions<TData, TVariables> extends Omit<UseMutationOptions<TData, Error, TVariables>, 'onMutate' | 'onError' | 'onSettled'> {
    queryKey: string[]
    updateFn: (oldData: any, variables: TVariables) => any
    successMessage?: string
    errorMessage?: string
}

export function useOptimisticUpdate<TData = unknown, TVariables = unknown>({
    queryKey,
    updateFn,
    successMessage,
    errorMessage,
    ...options
}: OptimisticUpdateOptions<TData, TVariables>) {
    const queryClient = useQueryClient()

    return useMutation<TData, Error, TVariables>({
        ...options,

        // Before mutation: update cache optimistically
        onMutate: async (variables) => {
            // Cancel any outgoing refetches to avoid overwriting optimistic update
            await queryClient.cancelQueries({ queryKey })

            // Snapshot the previous value
            const previousData = queryClient.getQueryData(queryKey)

            // Optimistically update to the new value
            queryClient.setQueryData(queryKey, (old: any) => updateFn(old, variables))

            // Return context with snapshot
            return { previousData }
        },

        // On error: rollback to previous data
        onError: (error, variables, context) => {
            // Type assertion since we know onMutate returns { previousData }
            const ctx = context as { previousData?: any } | undefined
            if (ctx?.previousData) {
                queryClient.setQueryData(queryKey, ctx.previousData)
            }

            // Show error toast
            toast.error(errorMessage || error.message || 'Operation failed')

            console.error('Optimistic update error:', error)
        },

        // On success: show success message
        onSuccess: () => {
            if (successMessage) {
                toast.success(successMessage)
            }
        },

        // Always refetch after error or success
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })
}

/**
 * Example: Optimistic product status toggle
 */
export function useOptimisticProductStatus() {
    return useOptimisticUpdate<any, { id: string; status: string }>({
        queryKey: ['products'],
        mutationFn: async (variables) => {
            // Your API call here
            const response = await fetch('/api/products/update-status', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(variables)
            })
            if (!response.ok) throw new Error('Failed to update status')
            return response.json()
        },
        updateFn: (products, { id, status }) => {
            if (!products) return products
            return products.map((p: any) =>
                p.id === id ? { ...p, status } : p
            )
        },
        successMessage: 'Product status updated',
        errorMessage: 'Failed to update product status'
    })
}

/**
 * Example: Optimistic variant toggle
 */
export function useOptimisticVariantToggle() {
    return useOptimisticUpdate<any, { variantId: string; active: boolean }>({
        queryKey: ['product-variants'],
        mutationFn: async (variables) => {
            const response = await fetch('/api/variants/toggle', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(variables)
            })
            if (!response.ok) throw new Error('Failed to toggle variant')
            return response.json()
        },
        updateFn: (variants, { variantId, active }) => {
            if (!variants) return variants
            return variants.map((v: any) =>
                v.id === variantId ? { ...v, active } : v
            )
        },
        successMessage: 'Variant updated',
        errorMessage: 'Failed to update variant'
    })
}
