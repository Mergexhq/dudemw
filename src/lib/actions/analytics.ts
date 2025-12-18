"use server"

import { supabaseAdmin } from '@/lib/supabase/supabase'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks } from 'date-fns'

export interface DashboardStats {
  revenue: {
    current: number
    previous: number
    change: number
    changePercent: string
  }
  orders: {
    current: number
    previous: number
    change: number
    changePercent: string
  }
  aov: {
    current: number
    previous: number
    change: number
    changePercent: string
  }
  customers: {
    current: number
    previous: number
    change: number
    changePercent: string
  }
}

export interface RecentOrder {
  id: string
  order_number: string
  customer_name: string
  customer_email: string
  total_amount: number
  status: string
  created_at: string
  items_count: number
}

export interface LowStockItem {
  id: string
  product_title: string
  variant_name: string
  sku: string
  current_stock: number
  low_stock_threshold: number
  status: 'out_of_stock' | 'low_stock'
}

export interface RecentActivity {
  id: string
  type: 'order_placed' | 'product_created' | 'inventory_updated' | 'customer_registered'
  description: string
  timestamp: string
  metadata?: any
}

// Helper function to calculate percentage change
function calculateChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

// Helper function to format percentage
function formatPercentage(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const currentMonthEnd = endOfMonth(now)
    const previousMonthStart = startOfMonth(subMonths(now, 1))
    const previousMonthEnd = endOfMonth(subMonths(now, 1))
    const currentWeekStart = startOfWeek(now)
    const currentWeekEnd = endOfWeek(now)
    const previousWeekStart = startOfWeek(subWeeks(now, 1))
    const previousWeekEnd = endOfWeek(subWeeks(now, 1))

    // Get current month revenue and orders
    const { data: currentMonthOrders, error: currentOrdersError } = await supabaseAdmin
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', currentMonthStart.toISOString())
      .lte('created_at', currentMonthEnd.toISOString())
      .eq('order_status', 'completed') // Only count completed orders

    if (currentOrdersError) throw currentOrdersError

    // Get previous month revenue and orders
    const { data: previousMonthOrders, error: previousOrdersError } = await supabaseAdmin
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', previousMonthStart.toISOString())
      .lte('created_at', previousMonthEnd.toISOString())
      .eq('order_status', 'completed')

    if (previousOrdersError) throw previousOrdersError

    // Get current week orders for order count comparison
    const { data: currentWeekOrders, error: currentWeekError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .gte('created_at', currentWeekStart.toISOString())
      .lte('created_at', currentWeekEnd.toISOString())

    if (currentWeekError) throw currentWeekError

    // Get previous week orders
    const { data: previousWeekOrders, error: previousWeekError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .gte('created_at', previousWeekStart.toISOString())
      .lte('created_at', previousWeekEnd.toISOString())

    if (previousWeekError) throw previousWeekError

    // Get customer counts (this month vs last month)
    const { data: currentMonthCustomers, error: currentCustomersError } = await supabaseAdmin
      .from('orders')
      .select('guest_email, user_id')
      .gte('created_at', currentMonthStart.toISOString())
      .lte('created_at', currentMonthEnd.toISOString())

    if (currentCustomersError) throw currentCustomersError

    const { data: previousMonthCustomers, error: previousCustomersError } = await supabaseAdmin
      .from('orders')
      .select('guest_email, user_id')
      .gte('created_at', previousMonthStart.toISOString())
      .lte('created_at', previousMonthEnd.toISOString())

    if (previousCustomersError) throw previousCustomersError

    // Calculate metrics
    const currentRevenue = currentMonthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    const previousRevenue = previousMonthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
    const revenueChange = calculateChange(currentRevenue, previousRevenue)

    const currentOrderCount = currentWeekOrders?.length || 0
    const previousOrderCount = previousWeekOrders?.length || 0
    const ordersChange = calculateChange(currentOrderCount, previousOrderCount)

    // Calculate AOV (Average Order Value)
    const currentAOV = currentMonthOrders?.length ? currentRevenue / currentMonthOrders.length : 0
    const previousAOV = previousMonthOrders?.length ? previousRevenue / previousMonthOrders.length : 0
    const aovChange = calculateChange(currentAOV, previousAOV)

    // Calculate unique customers
    const currentUniqueCustomers = new Set(currentMonthCustomers?.map(c => c.guest_email || c.user_id).filter(Boolean)).size
    const previousUniqueCustomers = new Set(previousMonthCustomers?.map(c => c.guest_email || c.user_id).filter(Boolean)).size
    const customersChange = calculateChange(currentUniqueCustomers, previousUniqueCustomers)

    const stats: DashboardStats = {
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        change: revenueChange,
        changePercent: formatPercentage(revenueChange)
      },
      orders: {
        current: currentOrderCount,
        previous: previousOrderCount,
        change: ordersChange,
        changePercent: formatPercentage(ordersChange)
      },
      aov: {
        current: currentAOV,
        previous: previousAOV,
        change: aovChange,
        changePercent: formatPercentage(aovChange)
      },
      customers: {
        current: currentUniqueCustomers,
        previous: previousUniqueCustomers,
        change: customersChange,
        changePercent: formatPercentage(customersChange)
      }
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return { success: false, error: 'Failed to fetch dashboard statistics' }
  }
}

export async function getRecentOrders(limit: number = 5): Promise<{ success: boolean; data?: RecentOrder[]; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        guest_email,
        user_id,
        total_amount,
        order_status,
        created_at,
        order_items (
          id
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    const recentOrders: RecentOrder[] = data?.map(order => ({
      id: order.id,
      order_number: `ORD-${order.id.slice(-6).toUpperCase()}`,
      customer_name: 'Guest Customer', // We don't have customer names in the schema
      customer_email: order.guest_email || '',
      total_amount: order.total_amount || 0,
      status: order.order_status || 'pending',
      created_at: order.created_at,
      items_count: order.order_items?.length || 0
    })) || []

    return { success: true, data: recentOrders }
  } catch (error) {
    console.error('Error fetching recent orders:', error)
    return { success: false, error: 'Failed to fetch recent orders' }
  }
}

export async function getLowStockItems(limit: number = 10): Promise<{ success: boolean; data?: LowStockItem[]; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('inventory_items')
      .select(`
        id,
        sku,
        quantity,
        low_stock_threshold,
        product_variants (
          id,
          name,
          products (
            id,
            title
          )
        )
      `)
      .or('quantity.eq.0,quantity.lte.low_stock_threshold')
      .order('quantity', { ascending: true })
      .limit(limit)

    if (error) throw error

    const lowStockItems: LowStockItem[] = data?.map(item => ({
      id: item.id,
      product_title: item.product_variants?.products?.title || 'Unknown Product',
      variant_name: item.product_variants?.name || 'Default Variant',
      sku: item.sku || '',
      current_stock: item.quantity || 0,
      low_stock_threshold: item.low_stock_threshold || 5,
      status: (item.quantity || 0) === 0 ? 'out_of_stock' : 'low_stock'
    })) || []

    return { success: true, data: lowStockItems }
  } catch (error) {
    console.error('Error fetching low stock items:', error)
    return { success: false, error: 'Failed to fetch low stock items' }
  }
}

export async function getRecentActivity(limit: number = 10): Promise<{ success: boolean; data?: RecentActivity[]; error?: string }> {
  try {
    // Get recent orders
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('id, guest_email, total_amount, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    // Get recent products
    const { data: recentProducts } = await supabaseAdmin
      .from('products')
      .select('id, title, created_at')
      .order('created_at', { ascending: false })
      .limit(3)

    // Get recent inventory updates (from inventory_logs if exists, otherwise skip)
    let recentInventory: any[] = []
    try {
      const { data } = await supabaseAdmin
        .from('inventory_logs')
        .select('id, sku, quantity_change, reason, created_at')
        .order('created_at', { ascending: false })
        .limit(3)
      recentInventory = data || []
    } catch (error) {
      // Ignore if table doesn't exist or has issues
      console.log('inventory_logs table not available, skipping inventory activities')
    }

    const activities: RecentActivity[] = []

    // Add order activities
    recentOrders?.forEach(order => {
      if (order.created_at) {
        activities.push({
          id: `order-${order.id}`,
          type: 'order_placed',
          description: `New order #${order.id.slice(-6)} placed by ${order.guest_email || 'Guest'} for ₹${order.total_amount?.toLocaleString() || 0}`,
          timestamp: order.created_at,
          metadata: { orderId: order.id, amount: order.total_amount }
        })
      }
    })

    // Add product activities
    recentProducts?.forEach(product => {
      if (product.created_at) {
        activities.push({
          id: `product-${product.id}`,
          type: 'product_created',
          description: `New product "${product.title}" was added to catalog`,
          timestamp: product.created_at,
          metadata: { productId: product.id }
        })
      }
    })

    // Add inventory activities
    recentInventory?.forEach(log => {
      if (log.created_at) {
        activities.push({
          id: `inventory-${log.id}`,
          type: 'inventory_updated',
          description: `Inventory updated for ${log.sku}: ${log.quantity_change > 0 ? '+' : ''}${log.quantity_change} units (${log.reason || 'Manual adjustment'})`,
          timestamp: log.created_at,
          metadata: { sku: log.sku, change: log.quantity_change }
        })
      }
    })

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return { success: true, data: sortedActivities }
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return { success: false, error: 'Failed to fetch recent activity' }
  }
}

// Real-time subscription helper
export async function subscribeToOrderUpdates(callback: (payload: any) => void) {
  try {
    const subscription = supabaseAdmin
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        callback
      )
      .subscribe()

    return subscription
  } catch (error) {
    console.error('Error setting up real-time subscription:', error)
    return null
  }
}