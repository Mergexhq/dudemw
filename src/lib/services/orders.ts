import { supabaseAdmin } from '@/lib/supabase/supabase'
import { OrderWithDetails, OrderFilters, PaginationInfo } from '@/lib/types/orders'

export class OrderService {
  // Get orders with filtering and pagination
  static async getOrders(filters?: OrderFilters, page: number = 1, limit: number = 20) {
    try {
      let query = supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            price,
            quantity,
            variant_id,
            product_variants (
              id,
              name,
              sku,
              products (
                id,
                title,
                slug
              )
            )
          ),
          shipping_address:addresses!shipping_address_id (
            id,
            address_line1,
            city,
            state,
            pincode,
            name,
            phone
          )
        `, { count: 'exact' })

      // Apply filters
      if (filters?.search) {
        query = query.or(`guest_email.ilike.%${filters.search}%,id.ilike.%${filters.search}%`)
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('order_status', filters.status)
      }

      if (filters?.paymentStatus && filters.paymentStatus !== 'all') {
        query = query.eq('payment_status', filters.paymentStatus)
      }

      if (filters?.customer) {
        query = query.eq('guest_email', filters.customer)
      }

      if (filters?.dateFrom && filters?.dateTo) {
        query = query
          .gte('created_at', filters.dateFrom)
          .lte('created_at', filters.dateTo)
      } else if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom)
      } else if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo)
      }

      // Apply pagination
      const from = (page - 1) * limit
      const to = from + limit - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      return { 
        success: true, 
        data: data as OrderWithDetails[], 
        total: count || 0,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        } as PaginationInfo
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      return { success: false, error: 'Failed to fetch orders' }
    }
  }

  // Get single order by ID
  static async getOrder(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            price,
            quantity,
            variant_id,
            product_variants (
              id,
              name,
              sku,
              products (
                id,
                title,
                slug
              )
            )
          ),
          shipping_address:addresses!shipping_address_id (
            id,
            address_line1,
            city,
            state,
            pincode,
            name,
            phone
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data: data as OrderWithDetails }
    } catch (error) {
      console.error('Error fetching order:', error)
      return { success: false, error: 'Failed to fetch order' }
    }
  }

  // Get order statistics
  static async getOrderStats() {
    try {
      const { data: orders, error } = await supabaseAdmin
        .from('orders')
        .select('order_status, total_amount, created_at')

      if (error) throw error

      const stats = {
        total: orders?.length || 0,
        pending: orders?.filter(o => o.order_status === 'pending').length || 0,
        processing: orders?.filter(o => o.order_status === 'processing').length || 0,
        shipped: orders?.filter(o => o.order_status === 'shipped').length || 0,
        delivered: orders?.filter(o => o.order_status === 'delivered').length || 0,
        cancelled: orders?.filter(o => o.order_status === 'cancelled').length || 0,
        totalRevenue: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0,
        averageOrderValue: orders?.length ? (orders.reduce((sum, o) => sum + (o.total_amount || 0), 0) / orders.length) : 0
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error fetching order stats:', error)
      return { success: false, error: 'Failed to fetch order statistics' }
    }
  }
}