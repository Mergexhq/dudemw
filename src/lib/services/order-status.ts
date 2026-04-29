import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { serializePrisma } from '@/lib/utils/prisma-utils'

export class OrderStatusService {
  private static async logStatusChange(orderId: string, status: string, note?: string) {
    try {
      await prisma.order_status_history.create({
        data: { order_id: orderId, status, note, created_at: new Date() } as any,
      })
    } catch (error) {
      console.error('Error logging status history:', error)
    }
  }

  static async updateOrderStatus(orderId: string, status: string, notes?: string) {
    try {
      const updateData: any = {
        order_status: status,
        updated_at: new Date(),
      }
      if (status === 'shipped') updateData.shipped_at = new Date()
      if (status === 'delivered') updateData.delivered_at = new Date()

      const data = await prisma.orders.update({
        where: { id: orderId },
        data: updateData,
      })

      await this.logStatusChange(orderId, status, notes)

      revalidatePath('/admin/orders')
      revalidatePath(`/admin/orders/${orderId}`)

      return { success: true, data: serializePrisma(data) }
    } catch (error) {
      console.error('Error updating order status:', error)
      return { success: false, error: 'Failed to update order status' }
    }
  }

  static async bulkUpdateOrderStatus(orderIds: string[], status: string, notes?: string) {
    try {
      const updateData: any = { order_status: status, updated_at: new Date() }
      if (status === 'shipped') updateData.shipped_at = new Date()
      if (status === 'delivered') updateData.delivered_at = new Date()

      const results = await prisma.orders.updateMany({
        where: { id: { in: orderIds } },
        data: updateData,
      })

      Promise.all(orderIds.map(id => this.logStatusChange(id, status, notes)))

      revalidatePath('/admin/orders')

      return {
        success: true,
        data: serializePrisma(results),
        updated: results.count,
        message: `Updated ${results.count} orders to ${status}`,
      }
    } catch (error) {
      console.error('Error bulk updating order status:', error)
      return { success: false, error: 'Failed to bulk update order status' }
    }
  }

  static async addTrackingInfo(orderId: string, trackingNumber: string, carrier: string) {
    try {
      const data = await prisma.orders.update({
        where: { id: orderId },
        data: {
          shipping_tracking_number: trackingNumber,
          shipping_provider: carrier,
          order_status: 'shipped',
          shipped_at: new Date(),
          updated_at: new Date(),
        } as any,
        select: {
          id: true,
          customer_phone_snapshot: true,
          customer_name_snapshot: true,
          shipping_tracking_number: true,
          shipping_provider: true,
          order_status: true,
          shipped_at: true,
          updated_at: true,
        } as any,
      }) as any

      await this.logStatusChange(orderId, 'shipped', `Shipped via ${carrier}. Tracking: ${trackingNumber}`)

      revalidatePath('/admin/orders')
      revalidatePath(`/admin/orders/${orderId}`)

      // ── Interakt: Order Shipped WhatsApp (fire-and-forget) ────────────────
      ;(async () => {
        try {
          const { sendOrderShipped } = await import('@/lib/services/interakt')
          const phone = data.customer_phone_snapshot?.replace(/\D/g, '')
          const customerName = data.customer_name_snapshot || 'Customer'

          console.log(`[Interakt] addTrackingInfo: phone="${phone}", name="${customerName}", orderId="${orderId}"`)

          if (phone) {
            await sendOrderShipped({
              customerPhone: phone,
              customerName,
              orderId,
              shippingCarrier: carrier,
              trackingNumber,
            })
          } else {
            console.warn(`[Interakt] Skipping WhatsApp — customer_phone_snapshot is empty for order ${orderId}`)
          }
        } catch (notifyErr) {
          console.error('[Interakt] Order shipped notification failed:', notifyErr)
        }
      })()
      // ─────────────────────────────────────────────────────────────────────

      return { success: true, data: serializePrisma(data) }
    } catch (error) {
      console.error('Error adding tracking info:', error)
      return { success: false, error: 'Failed to add tracking information' }
    }
  }

  static async cancelOrder(orderId: string, reason?: string) {
    try {
      console.log(`[Stock Restoration] Fetching order items for order ${orderId}`)
      const orderItems = await prisma.order_items.findMany({
        where: { order_id: orderId },
        select: { variant_id: true, quantity: true },
      })

      const data = await prisma.orders.update({
        where: { id: orderId },
        data: { order_status: 'cancelled', updated_at: new Date() } as any,
      })

      await this.logStatusChange(orderId, 'cancelled', reason)

      // Restore stock for each item
      if (orderItems.length > 0) {
        console.log(`[Stock Restoration] Restoring stock for ${orderItems.length} items`)
        for (const item of orderItems) {
          try {
            // Use Prisma atomic increment for stock — much simpler and safer
            await prisma.product_variants.update({
              where: { id: item.variant_id! },
              data: { stock: { increment: item.quantity } } as any,
            })
            console.log(`[Stock Restoration] Restored stock for variant ${item.variant_id}`)

            // Also update inventory_items if present
            await prisma.inventory_items
              .updateMany({
                where: { variant_id: item.variant_id! },
                data: {
                  quantity: { increment: item.quantity },
                  available_quantity: { increment: item.quantity },
                  updated_at: new Date(),
                } as any,
              })
              .catch((e: any) => console.error('inventory_items update skipped:', e?.message))
          } catch (stockError) {
            console.error(`[Stock Restoration] Exception for variant ${item.variant_id}:`, stockError)
          }
        }
      }

      revalidatePath('/admin/orders')
      revalidatePath(`/admin/orders/${orderId}`)

      return { success: true, data: serializePrisma(data) }
    } catch (error) {
      console.error('Error cancelling order:', error)
      return { success: false, error: 'Failed to cancel order' }
    }
  }
}
