import { supabaseAdmin } from '@/lib/supabase/supabase'
import {
  Customer,
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
   * Get customers with filtering and pagination
   */
  static async getCustomers(filters?: CustomerFilters, page: number = 1, limit: number = 20) {
    try {
      // Fetch users from auth.users
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: limit,
      })

      if (authError) throw authError

      const userIds = authUsers.users.map(user => user.id)

      // Get order statistics for these users
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('user_id, total_amount, created_at, order_status')
        .in('user_id', userIds)

      if (ordersError) throw ordersError

      // Calculate stats for each customer
      const customersWithStats: CustomerWithStats[] = authUsers.users.map(user => {
        const customerOrders = orders?.filter(o => o.user_id === user.id) || []
        const totalOrders = customerOrders.length
        const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
        const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
        const lastOrder = customerOrders.sort((a, b) => 
          new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
        )[0]

        // Determine status
        let status: 'active' | 'inactive' | 'vip' = 'inactive'
        if (totalSpent > 50000) {
          status = 'vip'
        } else if (totalOrders > 0) {
          const daysSinceLastOrder = lastOrder 
            ? Math.floor((Date.now() - new Date(lastOrder.created_at || '').getTime()) / (1000 * 60 * 60 * 24))
            : 999
          status = daysSinceLastOrder < 90 ? 'active' : 'inactive'
        }

        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          metadata: user.user_metadata,
          totalOrders,
          totalSpent,
          averageOrderValue,
          lastOrderDate: lastOrder?.created_at || null,
          lifetimeValue: totalSpent,
          status,
        }
      })

      // Apply filters
      let filteredCustomers = customersWithStats

      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filteredCustomers = filteredCustomers.filter(c =>
          c.email.toLowerCase().includes(searchLower) ||
          c.metadata?.full_name?.toLowerCase().includes(searchLower)
        )
      }

      if (filters?.status && filters.status !== 'all') {
        filteredCustomers = filteredCustomers.filter(c => c.status === filters.status)
      }

      if (filters?.dateFrom) {
        filteredCustomers = filteredCustomers.filter(c =>
          new Date(c.created_at) >= new Date(filters.dateFrom!)
        )
      }

      if (filters?.dateTo) {
        filteredCustomers = filteredCustomers.filter(c =>
          new Date(c.created_at) <= new Date(filters.dateTo!)
        )
      }

      if (filters?.minOrders) {
        filteredCustomers = filteredCustomers.filter(c => c.totalOrders >= filters.minOrders!)
      }

      if (filters?.minSpent) {
        filteredCustomers = filteredCustomers.filter(c => c.totalSpent >= filters.minSpent!)
      }

      const total = filteredCustomers.length

      return {
        success: true,
        data: filteredCustomers,
        total,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        } as PaginationInfo,
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
      console.error('Error fetching customers:', errorMessage, error)
      
      // Special handling for auth errors
      if (error?.message?.includes('User not allowed') || error?.message?.includes('JWT')) {
        return { 
          success: false, 
          error: 'Admin access required. Please ensure SUPABASE_SERVICE_ROLE_KEY is configured in environment variables.' 
        }
      }
      
      return { success: false, error: `Failed to fetch customers: ${errorMessage}` }
    }
  }

  /**
   * Get single customer with full details
   */
  static async getCustomer(id: string): Promise<{ success: boolean; data?: CustomerDetails; error?: string }> {
    try {
      // Get user from auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(id)

      if (authError) throw authError

      // Get customer orders
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          order_status,
          payment_status,
          order_items (
            id,
            quantity,
            price,
            product_variants (
              name,
              products (
                title
              )
            )
          )
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false })

      if (ordersError) throw ordersError

      // Get customer addresses
      const { data: addresses, error: addressesError } = await supabaseAdmin
        .from('addresses')
        .select('*')
        .eq('user_id', id)

      if (addressesError) throw addressesError

      // Calculate stats
      const totalOrders = orders?.length || 0
      const totalSpent = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
      const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0
      const lastOrder = orders?.[0]

      // Determine status
      let status: 'active' | 'inactive' | 'vip' = 'inactive'
      if (totalSpent > 50000) {
        status = 'vip'
      } else if (totalOrders > 0) {
        const daysSinceLastOrder = lastOrder
          ? Math.floor((Date.now() - new Date(lastOrder.created_at || '').getTime()) / (1000 * 60 * 60 * 24))
          : 999
        status = daysSinceLastOrder < 90 ? 'active' : 'inactive'
      }

      const customerDetails: CustomerDetails = {
        id: authUser.user.id,
        email: authUser.user.email || '',
        created_at: authUser.user.created_at,
        last_sign_in_at: authUser.user.last_sign_in_at,
        metadata: authUser.user.user_metadata,
        totalOrders,
        totalSpent,
        averageOrderValue,
        lastOrderDate: lastOrder?.created_at || null,
        lifetimeValue: totalSpent,
        status,
        orders: (orders as CustomerOrder[]) || [],
        addresses: addresses || [],
      }

      return { success: true, data: customerDetails }
    } catch (error) {
      console.error('Error fetching customer:', error)
      return { success: false, error: 'Failed to fetch customer details' }
    }
  }

  /**
   * Get customer statistics for dashboard
   */
  static async getCustomerStats(): Promise<{ success: boolean; data?: CustomerStats; error?: string }> {
    try {
      // Get all users
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()

      if (authError) throw authError

      const totalCustomers = authData.users.length

      // Get all orders
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('user_id, total_amount, created_at')

      if (ordersError) throw ordersError

      // Calculate stats
      const now = new Date()
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const newThisMonth = authData.users.filter(
        u => new Date(u.created_at) >= firstOfMonth
      ).length

      const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0

      // Calculate customer stats
      let activeCount = 0
      let inactiveCount = 0
      let vipCount = 0

      authData.users.forEach(user => {
        const customerOrders = orders?.filter(o => o.user_id === user.id) || []
        const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

        if (totalSpent > 50000) {
          vipCount++
        } else if (customerOrders.length > 0) {
          const lastOrder = customerOrders.sort((a, b) =>
            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
          )[0]
          const daysSinceLastOrder = Math.floor(
            (Date.now() - new Date(lastOrder.created_at || '').getTime()) / (1000 * 60 * 60 * 24)
          )
          if (daysSinceLastOrder < 90) {
            activeCount++
          } else {
            inactiveCount++
          }
        } else {
          inactiveCount++
        }
      })

      const stats: CustomerStats = {
        total: totalCustomers,
        active: activeCount,
        inactive: inactiveCount,
        vip: vipCount,
        newThisMonth,
        totalRevenue,
        averageLifetimeValue: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
      }

      return { success: true, data: stats }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
      console.error('Error fetching customer stats:', errorMessage, error)
      
      // Special handling for auth errors
      if (error?.message?.includes('User not allowed') || error?.message?.includes('JWT')) {
        return { 
          success: false, 
          error: 'Admin access required. Please ensure SUPABASE_SERVICE_ROLE_KEY is configured in environment variables.' 
        }
      }
      
      return { success: false, error: `Failed to fetch customer statistics: ${errorMessage}` }
    }
  }

  /**
   * Get customer order history
   */
  static async getCustomerOrders(customerId: string) {
    try {
      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          order_status,
          payment_status,
          order_items (
            id,
            quantity,
            price,
            product_variants (
              name,
              sku,
              products (
                title
              )
            )
          )
        `)
        .eq('user_id', customerId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: orders }
    } catch (error) {
      console.error('Error fetching customer orders:', error)
      return { success: false, error: 'Failed to fetch customer orders' }
    }
  }

  /**
   * Export customers to CSV format
   */
  static async exportCustomers(filters?: CustomerFilters): Promise<{ success: boolean; data?: CustomerExportData[]; error?: string }> {
    try {
      const result = await this.getCustomers(filters, 1, 10000) // Get all customers

      if (!result.success || !result.data) {
        return { success: false, error: 'Failed to fetch customers for export' }
      }

      const exportData: CustomerExportData[] = result.data.map(customer => ({
        Email: customer.email,
        'Full Name': customer.metadata?.full_name || 'N/A',
        'Join Date': new Date(customer.created_at).toLocaleDateString(),
        'Last Sign In': customer.last_sign_in_at
          ? new Date(customer.last_sign_in_at).toLocaleDateString()
          : 'Never',
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

  /**
   * Convert export data to CSV string
   */
  static convertToCSV(data: CustomerExportData[]): string {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header as keyof CustomerExportData]
          // Escape commas and quotes in values
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      ),
    ]

    return csvRows.join('\n')
  }
}
