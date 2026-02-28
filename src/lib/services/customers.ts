import { prisma } from '@/lib/db'
import {
  CustomerWithStats,
  CustomerFilters,
  CustomerStats,
  PaginationInfo,
  CustomerDetails,
  CustomerOrder,
  CustomerExportData,
} from '@/lib/types/customers'

export class CustomerService {
  /**
   * Get customers with filtering and pagination.
   * NOTE: Customers come from the `customers` table (not Supabase auth.users).
   * The `customers` table stores profile data; auth is handled by Clerk.
   */
  static async getCustomers(filters?: CustomerFilters, page: number = 1, limit: number = 20) {
    try {
      const where: any = {}

      if (filters?.search) {
        const s = filters.search
        where.OR = [
          { email: { contains: s, mode: 'insensitive' } },
          { first_name: { contains: s, mode: 'insensitive' } },
          { last_name: { contains: s, mode: 'insensitive' } },
          { phone: { contains: s, mode: 'insensitive' } },
        ]
      }

      if (filters?.status && filters.status !== 'all') {
        where.status = filters.status
      }

      if (filters?.dateFrom) where.created_at = { ...(where.created_at || {}), gte: new Date(filters.dateFrom) }
      if (filters?.dateTo) where.created_at = { ...(where.created_at || {}), lte: new Date(filters.dateTo) }

      const [customers, total] = await prisma.$transaction([
        prisma.customers.findMany({
          where,
          include: {
            orders: {
              select: { total_amount: true, created_at: true, order_status: true },
              orderBy: { created_at: 'desc' },
            },
          },
          orderBy: { created_at: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.customers.count({ where }),
      ])

      let customersWithStats: CustomerWithStats[] = customers.map(customer => {
        const orders = customer.orders || []
        const totalOrders = orders.length
        const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
        const lastOrder = orders[0]

        let status: 'active' | 'inactive' = 'inactive'
        if (totalOrders > 0 && lastOrder) {
          const days = Math.floor(
            (Date.now() - new Date(lastOrder.created_at || '').getTime()) / (1000 * 60 * 60 * 24)
          )
          status = days < 90 ? 'active' : 'inactive'
        }

        return {
          id: customer.id,
          email: customer.email || '',
          created_at: customer.created_at?.toISOString() || '',
          last_sign_in_at: null,
          metadata: { full_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() },
          totalOrders,
          totalSpent,
          averageOrderValue,
          lastOrderDate: lastOrder?.created_at?.toISOString() || null,
          lifetimeValue: totalSpent,
          status,
        }
      })

      // Apply post-query filters that require computed fields
      if (filters?.minOrders) customersWithStats = customersWithStats.filter(c => c.totalOrders >= filters.minOrders!)
      if (filters?.minSpent) customersWithStats = customersWithStats.filter(c => c.totalSpent >= filters.minSpent!)

      return {
        success: true,
        data: customersWithStats,
        total,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } as PaginationInfo,
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error?.message || error)
      return { success: false, error: `Failed to fetch customers: ${error?.message || 'Unknown error'}` }
    }
  }

  /** Get single customer with full details */
  static async getCustomer(id: string): Promise<{ success: boolean; data?: CustomerDetails; error?: string }> {
    try {
      const customer = await prisma.customers.findUnique({
        where: { id },
        include: {
          orders: {
            include: {
              order_items: {
                include: {
                  product_variants: {
                    include: {
                      products_product_variants_product_idToproducts: { select: { title: true } },
                    },
                  },
                },
              },
            },
            orderBy: { created_at: 'desc' },
          },
          customer_addresses: true,
        },
      })

      if (!customer) return { success: false, error: 'Customer not found' }

      const orders = customer.orders || []
      const totalOrders = orders.length
      const totalSpent = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
      const lastOrder = orders[0]

      let status: 'active' | 'inactive' = 'inactive'
      if (totalOrders > 0 && lastOrder) {
        const days = Math.floor(
          (Date.now() - new Date(lastOrder.created_at || '').getTime()) / (1000 * 60 * 60 * 24)
        )
        status = days < 90 ? 'active' : 'inactive'
      }

      const customerDetails: CustomerDetails = {
        id: customer.id,
        email: customer.email || '',
        created_at: customer.created_at?.toISOString() || '',
        last_sign_in_at: null,
        metadata: { full_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() },
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate: lastOrder?.created_at?.toISOString() || null,
        lifetimeValue: totalSpent,
        status,
        orders: orders as unknown as CustomerOrder[],
        addresses: customer.customer_addresses || [],
      }

      return { success: true, data: customerDetails }
    } catch (error: any) {
      console.error('Error fetching customer:', error?.message)
      return { success: false, error: `Failed to fetch customer details: ${error?.message}` }
    }
  }

  /** Get customer statistics for dashboard */
  static async getCustomerStats(): Promise<{ success: boolean; data?: CustomerStats; error?: string }> {
    try {
      const [totalCustomers, activeCount] = await prisma.$transaction([
        prisma.customers.count(),
        prisma.customers.count({ where: { status: 'active' } }),
      ])

      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const newThisMonth = await prisma.customers.count({
        where: { created_at: { gte: firstOfMonth } },
      })

      const revenueResult = await prisma.orders.aggregate({
        _sum: { total_amount: true },
      })

      const stats: CustomerStats = {
        total: totalCustomers,
        active: activeCount,
        inactive: totalCustomers - activeCount,
        newThisMonth,
        totalRevenue: Number(revenueResult._sum.total_amount || 0),
        registered: totalCustomers,
        guests: 0,
      }

      return { success: true, data: stats }
    } catch (error: any) {
      console.error('Error fetching customer stats:', error?.message)
      return { success: false, error: `Failed to fetch customer statistics: ${error?.message}` }
    }
  }

  /** Get customer order history */
  static async getCustomerOrders(customerId: string) {
    try {
      const orders = await prisma.orders.findMany({
        where: { customer_id: customerId },
        include: {
          order_items: {
            include: {
              product_variants: {
                include: {
                  products_product_variants_product_idToproducts: { select: { title: true } },
                },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      })
      return { success: true, data: orders }
    } catch (error) {
      console.error('Error fetching customer orders:', error)
      return { success: false, error: 'Failed to fetch customer orders' }
    }
  }

  /** Export customers to CSV */
  static async exportCustomers(filters?: CustomerFilters): Promise<{ success: boolean; data?: CustomerExportData[]; error?: string }> {
    try {
      const result = await this.getCustomers(filters, 1, 10000)
      if (!result.success || !result.data) return { success: false, error: 'Failed to fetch customers for export' }

      const exportData: CustomerExportData[] = result.data.map(customer => ({
        Email: customer.email,
        'Full Name': customer.metadata?.full_name || 'N/A',
        'Join Date': new Date(customer.created_at).toLocaleDateString(),
        'Last Sign In': customer.last_sign_in_at ? new Date(customer.last_sign_in_at).toLocaleDateString() : 'Never',
        'Total Orders': customer.totalOrders,
        'Total Spent': `₹${customer.totalSpent.toLocaleString()}`,
        'Average Order Value': `₹${customer.averageOrderValue.toFixed(2)}`,
        Status: customer.status.charAt(0).toUpperCase() + customer.status.slice(1),
      }))

      return { success: true, data: exportData }
    } catch (error) {
      console.error('Error exporting customers:', error)
      return { success: false, error: 'Failed to export customers' }
    }
  }

  static convertToCSV(data: CustomerExportData[]): string {
    if (data.length === 0) return ''
    const headers = Object.keys(data[0])
    return [
      headers.join(','),
      ...data.map(row =>
        headers.map(h => `"${String(row[h as keyof CustomerExportData]).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')
  }
}
