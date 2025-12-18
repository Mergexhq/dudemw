import { supabaseAdmin } from '@/lib/supabase/supabase'
import { revalidatePath } from 'next/cache'

export class OrderStatusService {
  // Update order status
  static async updateOrderStatus(orderId: string, status: string, notes?: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ 
          order_status: status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      revalidatePath('/admin/orders')
      revalidatePath(`/admin/orders/${orderId}`)
      
      return { success: true, data }
    } catch (error) {
      console.error('Error updating order status:', error)
      return { success: false, error: 'Failed to update order status' }
    }
  }

  // Bulk update order status
  static async bulkUpdateOrderStatus(orderIds: string[], status: string, notes?: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ 
          order_status: status,
          updated_at: new Date().toISOString(),
        })
        .in('id', orderIds)
        .select()

      if (error) throw error

      revalidatePath('/admin/orders')
      
      return { success: true, data, updated: data.length, message: `Updated ${data.length} orders to ${status}` }
    } catch (error) {
      console.error('Error bulk updating order status:', error)
      return { success: false, error: 'Failed to bulk update order status' }
    }
  }

  // Add tracking information
  static async addTrackingInfo(orderId: string, trackingNumber: string, carrier: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ 
          shipping_tracking_number: trackingNumber,
          shipping_provider: carrier,
          order_status: 'shipped',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      revalidatePath('/admin/orders')
      revalidatePath(`/admin/orders/${orderId}`)
      
      return { success: true, data }
    } catch (error) {
      console.error('Error adding tracking info:', error)
      return { success: false, error: 'Failed to add tracking information' }
    }
  }

  // Cancel order
  static async cancelOrder(orderId: string, reason?: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ 
          order_status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      revalidatePath('/admin/orders')
      revalidatePath(`/admin/orders/${orderId}`)
      
      return { success: true, data }
    } catch (error) {
      console.error('Error cancelling order:', error)
      return { success: false, error: 'Failed to cancel order' }
    }
  }
}