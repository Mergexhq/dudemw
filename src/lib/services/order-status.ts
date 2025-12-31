import { supabaseAdmin } from '@/lib/supabase/supabase'
import { revalidatePath } from 'next/cache'

export class OrderStatusService {
  // Helper to log status history
  private static async logStatusChange(orderId: string, status: string, note?: string) {
    try {
      const { error } = await supabaseAdmin
        .from('order_status_history' as any)
        .insert({
          order_id: orderId,
          status,
          note,
          created_at: new Date().toISOString()
        })
      if (error) {
        console.error('Error inserting status history:', error)
      }
    } catch (error) {
      console.error('Error logging status history:', error)
      // Don't throw, just log error so main flow continues
    }
  }

  // Update order status
  static async updateOrderStatus(orderId: string, status: string, notes?: string) {
    try {
      const updateData: any = {
        order_status: status,
        updated_at: new Date().toISOString(),
      }

      // Set timestamps based on status
      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      // Log history
      await this.logStatusChange(orderId, status, notes)

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
      const updateData: any = {
        order_status: status,
        updated_at: new Date().toISOString(),
      }

      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }

      const { data, error } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .in('id', orderIds)
        .select()

      if (error) throw error

      // Log history for each order
      // We do this asynchronously to not block the response
      Promise.all(orderIds.map(id => this.logStatusChange(id, status, notes)))

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
          shipped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      // Log history
      await this.logStatusChange(orderId, 'shipped', `Shipped via ${carrier}. Tracking: ${trackingNumber}`)

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
      // First, get the order items to restore stock
      console.log(`[Stock Restoration] Fetching order items for order ${orderId}`)
      const { data: orderItems, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('variant_id, quantity')
        .eq('order_id', orderId)

      if (itemsError) {
        console.error('[Stock Restoration] Error fetching order items:', itemsError)
      }

      // Update order status to cancelled
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

      // Log history
      await this.logStatusChange(orderId, 'cancelled', reason)

      // Restore stock for each item
      if (orderItems && orderItems.length > 0) {
        console.log(`[Stock Restoration] Restoring stock for ${orderItems.length} items`)
        for (const item of orderItems) {
          try {
            console.log(`[Stock Restoration] Processing variant ${item.variant_id}, quantity: ${item.quantity}`)

            // Get current stock from product_variants
            const { data: variant, error: variantError } = await supabaseAdmin
              .from('product_variants')
              .select('stock')
              .eq('id', item.variant_id)
              .single()

            if (variantError) {
              console.error(`[Stock Restoration] Error fetching variant ${item.variant_id}:`, variantError)
              continue
            }

            if (variant) {
              const currentStock = variant.stock || 0
              const newStock = currentStock + item.quantity

              console.log(`[Stock Restoration] Variant ${item.variant_id}: ${currentStock} -> ${newStock}`)

              // Update stock in product_variants table
              const { error: updateError } = await supabaseAdmin
                .from('product_variants')
                .update({ stock: newStock })
                .eq('id', item.variant_id)

              if (updateError) {
                console.error(`[Stock Restoration] Error updating product_variants stock for variant ${item.variant_id}:`, updateError)
              } else {
                console.log(`[Stock Restoration] Successfully restored product_variants stock for variant ${item.variant_id}`)
              }

              // Also update inventory_items table if it exists for this variant
              const { data: inventoryItem, error: invFetchError } = await supabaseAdmin
                .from('inventory_items')
                .select('id, quantity, available_quantity')
                .eq('variant_id', item.variant_id)
                .single()

              if (!invFetchError && inventoryItem) {
                const currentInvQty = inventoryItem.quantity || 0
                const currentAvailable = inventoryItem.available_quantity || 0
                const newInvQty = currentInvQty + item.quantity
                const newAvailable = currentAvailable + item.quantity

                console.log(`[Stock Restoration] Inventory item ${inventoryItem.id}: quantity ${currentInvQty} -> ${newInvQty}`)

                const { error: invUpdateError } = await supabaseAdmin
                  .from('inventory_items')
                  .update({
                    quantity: newInvQty,
                    available_quantity: newAvailable,
                    updated_at: new Date().toISOString()
                  })
                  .eq('variant_id', item.variant_id)

                if (invUpdateError) {
                  console.error(`[Stock Restoration] Error updating inventory_items for variant ${item.variant_id}:`, invUpdateError)
                } else {
                  console.log(`[Stock Restoration] Successfully restored inventory_items for variant ${item.variant_id}`)
                }
              }
            }
          } catch (stockError) {
            console.error(`[Stock Restoration] Exception for variant ${item.variant_id}:`, stockError)
            // Continue with other items even if one fails
          }
        }
      } else {
        console.log('[Stock Restoration] No order items found to restore')
      }

      revalidatePath('/admin/orders')
      revalidatePath(`/admin/orders/${orderId}`)

      return { success: true, data }
    } catch (error) {
      console.error('Error cancelling order:', error)
      return { success: false, error: 'Failed to cancel order' }
    }
  }
}