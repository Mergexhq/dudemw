import { prisma } from '@/lib/db'
import { OrderWithDetails, OrderFilters, PaginationInfo } from '@/lib/types/orders'
import { Prisma } from '@/generated/prisma/client'

/**
 * Recursively converts Prisma Decimal objects to plain numbers so they can
 * cross the Server → Client Component boundary without throwing.
 */
function serializeOrder(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj?.toNumber === 'function') return obj.toNumber()
  if (obj instanceof Date) return obj.toISOString()
  if (Array.isArray(obj)) return obj.map(serializeOrder)
  if (typeof obj === 'object') {
    const out: Record<string, any> = {}
    for (const key of Object.keys(obj)) out[key] = serializeOrder(obj[key])
    return out
  }
  return obj
}

export class OrderService {
  /** Get orders with filtering and pagination */
  static async getOrders(filters?: OrderFilters, page: number = 1, limit: number = 20) {
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
      if (filters?.total_amount?.min !== undefined && filters.total_amount.min !== null) where.total_amount = { gte: filters.total_amount.min }
      if (filters?.total_amount?.max !== undefined) {
        where.total_amount = { ...(where.total_amount as any), lte: filters.total_amount.max }
      }
      if (filters?.created_at?.from || filters?.created_at?.to) {
        where.created_at = {
          ...(filters.created_at.from && { gte: new Date(filters.created_at.from) }),
          ...(filters.created_at.to && { lte: new Date(filters.created_at.to) }),
        }
      }

      const [data, total] = await prisma.$transaction([
        prisma.orders.findMany({
          where,
          include: {
            order_items: {
              include: {
                product_variants: {
                  include: {
                    product: {
                      select: { id: true, title: true, slug: true },
                    },
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.orders.count({ where }),
      ])

      return {
        success: true,
        data: serializeOrder(data) as OrderWithDetails[],
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        } as PaginationInfo,
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      return { success: false, error: 'Failed to fetch orders' }
    }
  }

  /** Get a single order by ID with full details */
  static async getOrder(id: string) {
    try {
      const data = await prisma.orders.findUnique({
        where: { id },
        include: {
          order_items: {
            include: {
              product_variants: {
                include: {
                  product: {
                    select: {
                      id: true,
                      title: true,
                      slug: true,
                      product_images: { select: { image_url: true, is_primary: true } },
                    },
                  },
                  variant_images: true,
                },
              },
            },
          },
          order_status_history: {
            orderBy: { created_at: 'asc' },
          },
        },
      })

      if (!data) return { success: false, error: 'Order not found' }

      return { success: true, data: serializeOrder(data) as OrderWithDetails }
    } catch (error) {
      console.error('Error fetching order:', error)
      return { success: false, error: 'Failed to fetch order' }
    }
  }

  /** Get order statistics */
  static async getOrderStats() {
    try {
      const orders = await prisma.orders.findMany({
        select: { order_status: true, total_amount: true, created_at: true },
      })

      const stats = {
        total: orders.length,
        pending: orders.filter(o => o.order_status === 'pending').length,
        processing: orders.filter(o => o.order_status === 'processing').length,
        shipped: orders.filter(o => o.order_status === 'shipped').length,
        delivered: orders.filter(o => o.order_status === 'delivered').length,
        cancelled: orders.filter(o => o.order_status === 'cancelled').length,
        totalRevenue: orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
        averageOrderValue: orders.length
          ? orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) / orders.length
          : 0,
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error fetching order stats:', error)
      return { success: false, error: 'Failed to fetch order statistics' }
    }
  }

  /** Update order status */
  static async updateOrderStatus(id: string, status: string) {
    try {
      const data = await prisma.orders.update({
        where: { id },
        data: { order_status: status, updated_at: new Date() },
      })
      return { success: true, data }
    } catch (error) {
      console.error('Error updating order status:', error)
      return { success: false, error: 'Failed to update order status' }
    }
  }

  /** Cancel order */
  static async cancelOrder(id: string) {
    try {
      const data = await prisma.orders.update({
        where: { id },
        data: { order_status: 'cancelled', updated_at: new Date() },
      })
      return { success: true, data }
    } catch (error) {
      console.error('Error cancelling order:', error)
      return { success: false, error: 'Failed to cancel order' }
    }
  }
}