import { useMutation, useQueryClient } from '@tanstack/react-query'
import { OrderStatusService } from '@/lib/services/order-status'
import { orderKeys } from '../queries/useOrders'
import { toast } from 'sonner'

/**
 * Mutation hook for updating order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const result = await OrderStatusService.updateOrderStatus(orderId, status)
      if (!result.success) {
        throw new Error(result.error || 'Failed to update order status')
      }
      return result
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() })
      toast.success('Order status updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update order status')
    },
  })
}

/**
 * Mutation hook for cancelling an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (orderId: string) => {
      const result = await OrderStatusService.cancelOrder(orderId)
      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel order')
      }
      return result
    },
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() })
      queryClient.invalidateQueries({ queryKey: orderKeys.detail(orderId) })
      queryClient.invalidateQueries({ queryKey: orderKeys.stats() })
      toast.success('Order cancelled successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel order')
    },
  })
}
