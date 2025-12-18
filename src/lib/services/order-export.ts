import { OrderService } from './orders'
import { OrderFilters } from '@/lib/types/orders'

export class OrderExportService {
  // Export orders to CSV
  static async exportOrders(filters?: OrderFilters) {
    try {
      const result = await OrderService.getOrders(filters, 1, 1000) // Get up to 1000 orders for export
      
      if (!result.success || !result.data) {
        return { success: false, error: 'No orders found to export' }
      }

      const orders = result.data

      // Convert to CSV format
      const csvHeaders = [
        'Order ID',
        'Customer Email',
        'Status',
        'Payment Status',
        'Total Amount',
        'Items Count',
        'Created At',
        'Updated At'
      ]

      const csvRows = orders.map(order => [
        order.id,
        order.guest_email || 'N/A',
        order.order_status || 'N/A',
        order.payment_status || 'N/A',
        order.total_amount || 0,
        order.order_items?.length || 0,
        order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
        order.updated_at ? new Date(order.updated_at).toLocaleDateString() : 'N/A'
      ])

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      return { success: true, data: csvContent }
    } catch (error) {
      console.error('Error exporting orders:', error)
      return { success: false, error: 'Failed to export orders' }
    }
  }
}