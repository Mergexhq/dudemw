import { prisma } from '@/lib/db'
import { Prisma } from '@/generated/prisma/client'
import { OrderFilters } from '@/lib/types/orders'

// Map of field key -> { header label, value extractor }
const FIELD_MAP: Record<string, { label: string; getValue: (order: any) => string | number }> = {
  order_id: { label: 'Order ID', getValue: o => o.id },
  order_number: { label: 'Order Number', getValue: o => o.order_number || 'N/A' },
  order_status: { label: 'Order Status', getValue: o => o.order_status || 'N/A' },
  payment_status: { label: 'Payment Status', getValue: o => o.payment_status || 'N/A' },
  payment_method: { label: 'Payment Method', getValue: o => o.payment_method || 'N/A' },
  customer_name: { label: 'Customer Name', getValue: o => o.customer_name_snapshot || 'N/A' },
  customer_email: { label: 'Customer Email', getValue: o => o.customer_email_snapshot || o.guest_email || 'N/A' },
  customer_phone: { label: 'Customer Phone', getValue: o => o.customer_phone_snapshot || 'N/A' },
  subtotal: { label: 'Subtotal (₹)', getValue: o => o.subtotal_amount ?? 0 },
  shipping_amount: { label: 'Shipping (₹)', getValue: o => o.shipping_amount ?? 0 },
  discount_amount: { label: 'Discount (₹)', getValue: o => o.discount_amount ?? 0 },
  total_amount: { label: 'Total (₹)', getValue: o => o.total_amount ?? 0 },
  items_count: { label: 'Items Count', getValue: o => o.order_items?.length ?? 0 },
  shipping_address: {
    label: 'Shipping Address', getValue: o => {
      const addr = o.shipping_address
      if (!addr || typeof addr !== 'object') return 'N/A'
      return [addr.address, addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ')
    }
  },
  created_at: { label: 'Created At', getValue: o => o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN') : 'N/A' },
  updated_at: { label: 'Updated At', getValue: o => o.updated_at ? new Date(o.updated_at).toLocaleDateString('en-IN') : 'N/A' },
}

// Default fields when none are specified
const DEFAULT_FIELDS = ['order_id', 'customer_email', 'order_status', 'payment_status', 'total_amount', 'items_count', 'created_at', 'updated_at']

export class OrderExportService {
  // Export orders to CSV, optionally filtered to specific columns
  static async exportOrders(filters?: OrderFilters, fields?: string[]) {
    try {
      const where: Prisma.ordersWhereInput = {}

      if (filters?.search) {
        where.OR = [
          { customer_email_snapshot: { contains: filters.search, mode: 'insensitive' } },
          { customer_name_snapshot: { contains: filters.search, mode: 'insensitive' } },
          { customer_phone_snapshot: { contains: filters.search, mode: 'insensitive' } },
        ]
      }
      if (filters?.order_status) where.order_status = filters.order_status
      if (filters?.payment_status) where.payment_status = filters.payment_status
      if (filters?.payment_method) where.payment_method = filters.payment_method
      if (filters?.shipping_provider) where.shipping_provider = filters.shipping_provider
      if (filters?.customer) where.guest_email = filters.customer
      if (filters?.total_amount?.min !== undefined && filters.total_amount.min !== null) {
        where.total_amount = { gte: filters.total_amount.min }
      }
      if (filters?.total_amount?.max !== undefined) {
        where.total_amount = { ...(where.total_amount as any), lte: filters.total_amount.max }
      }
      if (filters?.created_at?.from || filters?.created_at?.to) {
        where.created_at = {
          ...(filters.created_at.from && { gte: new Date(filters.created_at.from) }),
          ...(filters.created_at.to && { lte: new Date(filters.created_at.to) }),
        }
      }
      if (filters?.orderIds && filters.orderIds.length > 0) {
        where.id = { in: filters.orderIds }
      }

      const orders = await prisma.orders.findMany({
        where,
        select: {
          id: true,
          order_number: true,
          order_status: true,
          payment_status: true,
          payment_method: true,
          customer_name_snapshot: true,
          customer_email_snapshot: true,
          guest_email: true,
          customer_phone_snapshot: true,
          subtotal_amount: true,
          shipping_amount: true,
          discount_amount: true,
          total_amount: true,
          shipping_address: true,
          created_at: true,
          updated_at: true,
          order_items: {
            select: {
              id: true
            }
          }
        },
        orderBy: { created_at: 'desc' },
        take: 10000
      })

      if (!orders || orders.length === 0) {
        return { success: false, error: 'No orders found to export' }
      }

      const activeFields = (fields && fields.length > 0 ? fields : DEFAULT_FIELDS)
        .filter(key => key in FIELD_MAP) // Only include valid known fields

      const csvHeaders = activeFields.map(key => FIELD_MAP[key].label)
      const csvRows = orders.map(order =>
        activeFields.map(key => FIELD_MAP[key].getValue(order))
      )

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      return { success: true, data: csvContent }
    } catch (error) {
      console.error('Error exporting orders:', error)
      return { success: false, error: 'Failed to export orders' }
    }
  }
}
