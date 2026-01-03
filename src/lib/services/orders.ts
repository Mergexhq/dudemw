import { supabaseAdmin } from '@/lib/supabase/supabase'
import { createClient } from '@/lib/supabase/client'
import { OrderWithDetails, OrderFilters, PaginationInfo } from '@/lib/types/orders'

// Helper to get appropriate client - use client-side supabase for browser, admin for server
const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    return createClient()
  }
  return supabaseAdmin
}

export class OrderService {
  // Get orders with filtering and pagination
  static async getOrders(filters?: OrderFilters, page: number = 1, limit: number = 20) {
    try {
      // Use supabaseAdmin to bypass RLS for admin pages
      let query

      if (filters?.search) {
        query = (supabaseAdmin as any).rpc('admin_search_orders', { search_term: filters.search })
      } else {
        query = supabaseAdmin.from('orders')
      }

      // Chain select with relationships and count
      query = query.select(`
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
              products!product_variants_product_id_fkey (
                id,
                title,
                slug
              )
            )
          )
        `, { count: 'exact' })

      // Apply filters
      if (filters?.order_status) {
        query = query.eq('order_status', filters.order_status)
      }

      if (filters?.payment_status) {
        query = query.eq('payment_status', filters.payment_status)
      }

      if (filters?.payment_method) {
        query = query.eq('payment_method', filters.payment_method)
      }

      if (filters?.shipping_provider) {
        query = query.eq('shipping_provider', filters.shipping_provider)
      }

      // Apply amount range filter
      if (filters?.total_amount) {
        if (filters.total_amount.min !== undefined && filters.total_amount.min !== null) {
          query = query.gte('total_amount', filters.total_amount.min)
        }
        if (filters.total_amount.max !== undefined && filters.total_amount.max !== null) {
          query = query.lte('total_amount', filters.total_amount.max)
        }
      }

      // Apply date range filter
      if (filters?.created_at) {
        if (filters.created_at.from) {
          query = query.gte('created_at', filters.created_at.from)
        }
        if (filters.created_at.to) {
          query = query.lte('created_at', filters.created_at.to)
        }
      }

      if (filters?.customer) {
        query = query.eq('guest_email', filters.customer)
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
        data: data as unknown as OrderWithDetails[],
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
      // Use supabaseAdmin to bypass RLS for admin pages
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
              products!product_variants_product_id_fkey (
                id,
                title,
                slug
              )
            )
          ),
          order_status_history (
            id,
            status,
            note,
            created_at
          )
        `)
        .eq('id', id)
        .order('created_at', { foreignTable: 'order_status_history', ascending: true })
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data: data as unknown as OrderWithDetails }
    } catch (error) {
      console.error('Error fetching order:', error)
      return { success: false, error: 'Failed to fetch order' }
    }
  }

  // Get order statistics
  static async getOrderStats() {
    try {
      // Use supabaseAdmin to bypass RLS for admin pages
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

  // Update order status
  static async updateOrderStatus(id: string, status: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ order_status: status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error updating order status:', error)
      return { success: false, error: 'Failed to update order status' }
    }
  }

  // Cancel order
  static async cancelOrder(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .update({ order_status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error cancelling order:', error)
      return { success: false, error: 'Failed to cancel order' }
    }
  }
}