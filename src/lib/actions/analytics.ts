"use server"

import { supabaseAdmin } from '@/lib/supabase/supabase'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, subWeeks } from 'date-fns'
import { getCached, CacheTTL } from '@/lib/cache/server-cache'

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

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface TopProduct {
  id: string
  title: string
  revenue: number
  orders: number
  image_url?: string
}

export interface CategoryPerformance {
  id: string
  name: string
  revenue: number
  orders: number
  products: number
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
  // Add caching wrapper to prevent 6-8 queries on every dashboard load
  return getCached('dashboard:stats', async () => {
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
        .neq('order_status', 'cancelled') // Count all orders except cancelled

      if (currentOrdersError) throw currentOrdersError

      // Get previous month revenue and orders
      const { data: previousMonthOrders, error: previousOrdersError } = await supabaseAdmin
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', previousMonthStart.toISOString())
        .lte('created_at', previousMonthEnd.toISOString())
        .neq('order_status', 'cancelled')

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
  }, CacheTTL.STATS) // 5 minute cache
}

export async function getRecentOrders(limit: number = 5): Promise<{ success: boolean; data?: RecentOrder[]; error?: string }> {
  return getCached(`analytics:recent-orders:${limit}`, async () => {
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
        created_at: order.created_at || new Date().toISOString(),
        items_count: order.order_items?.length || 0
      })) || []

      return { success: true, data: recentOrders }
    } catch (error) {
      console.error('Error fetching recent orders:', error)
      return { success: false, error: 'Failed to fetch recent orders' }
    }
  }, 60) // 1 minute cache for recent orders
}

export async function getLowStockItems(limit: number = 10): Promise<{ success: boolean; data?: LowStockItem[]; error?: string }> {
  return getCached(`analytics:low-stock:${limit}`, async () => {
    try {
      // PostgREST can't compare column-to-column, so we fetch items with low quantities
      // and filter in JS to check against their individual thresholds
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
            products!product_variants_product_id_fkey (
              id,
              title
            )
          )
        `)
        .lte('quantity', 20) // Fetch items with quantity <= 20 (generous max threshold)
        .order('quantity', { ascending: true })

      if (error) throw error

      // Filter items where quantity <= their individual low_stock_threshold
      const lowStockItems: LowStockItem[] = (data || [])
        .filter(item => {
          const threshold = item.low_stock_threshold || 5
          return (item.quantity || 0) <= threshold
        })
        .slice(0, limit)
        .map(item => ({
          id: item.id,
          product_title: item.product_variants?.products?.title || 'Unknown Product',
          variant_name: item.product_variants?.name || 'Default Variant',
          sku: item.sku || '',
          current_stock: item.quantity || 0,
          low_stock_threshold: item.low_stock_threshold || 5,
          status: (item.quantity || 0) === 0 ? 'out_of_stock' : 'low_stock'
        }))

      return { success: true, data: lowStockItems }
    } catch (error) {
      console.error('Error fetching low stock items:', error)
      return { success: false, error: 'Failed to fetch low stock items' }
    }
  }, CacheTTL.STATS) // 5 minute cache
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
      const { data } = await (supabaseAdmin as any)
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


// Chart Data Actions

export async function getRevenueChart(period: 'daily' | 'weekly' | 'monthly' = 'daily', days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Group by date
    const chartData: { [key: string]: number } = {}

    orders?.forEach(order => {
      if (!order.created_at) return
      const date = new Date(order.created_at)
      let key: string

      if (period === 'daily') {
        key = date.toISOString().split('T')[0]
      } else if (period === 'weekly') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      chartData[key] = (chartData[key] || 0) + (order.total_amount || 0)
    })

    const data: ChartDataPoint[] = Object.entries(chartData).map(([date, value]) => ({
      date,
      value,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }))

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching revenue chart:', error)
    return { success: false, error: 'Failed to fetch revenue chart data' }
  }
}

export async function getOrdersChart(days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Group by date
    const chartData: { [key: string]: number } = {}

    orders?.forEach(order => {
      if (!order.created_at) return
      const date = new Date(order.created_at).toISOString().split('T')[0]
      chartData[date] = (chartData[date] || 0) + 1
    })

    const data: ChartDataPoint[] = Object.entries(chartData).map(([date, value]) => ({
      date,
      value,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }))

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching orders chart:', error)
    return { success: false, error: 'Failed to fetch orders chart data' }
  }
}

export async function getTopProducts(limit: number = 10) {
  // Use database RPC function with caching for optimal performance
  return getCached(`analytics:top-products:${limit}`, async () => {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_top_products', { limit_count: limit })

      if (error) throw error

      const topProducts: TopProduct[] = data?.map((product: any) => ({
        id: product.id,
        title: product.title,
        revenue: Number(product.revenue) || 0,
        orders: Number(product.orders) || 0,
        image_url: product.image_url || undefined
      })) || []

      return { success: true, data: topProducts }
    } catch (error) {
      console.error('Error fetching top products:', error)
      return { success: false, error: 'Failed to fetch top products' }
    }
  }, CacheTTL.ANALYTICS) // 10 minute cache
}

export async function getCategoryPerformance() {
  // Use database RPC function to eliminate N+1 queries
  // This reduces 50+ queries to a single optimized SQL query
  return getCached('analytics:category-performance', async () => {
    try {
      const { data, error } = await supabaseAdmin
        .rpc('get_category_performance')

      if (error) throw error

      const performance: CategoryPerformance[] = data?.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        revenue: Number(cat.revenue) || 0,
        orders: Number(cat.orders) || 0,
        products: Number(cat.products) || 0
      })) || []

      return { success: true, data: performance }
    } catch (error) {
      console.error('Error fetching category performance:', error)
      return { success: false, error: 'Failed to fetch category performance' }
    }
  }, CacheTTL.ANALYTICS) // 10 minute cache
}

export interface OrderStatusData {
  status: string
  count: number
  revenue: number
  percentage: number
}

export async function getOrderStatusDistribution() {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('order_status, total_amount')

    if (error) throw error

    // Group by status
    const statusMap = new Map<string, { count: number; revenue: number }>()
    let totalOrders = 0

    orders?.forEach((order) => {
      const status = order.order_status || 'unknown'
      const existing = statusMap.get(status) || { count: 0, revenue: 0 }

      statusMap.set(status, {
        count: existing.count + 1,
        revenue: existing.revenue + (Number(order.total_amount) || 0)
      })
      totalOrders++
    })

    // Convert to array with percentages
    const distribution: OrderStatusData[] = Array.from(statusMap.entries()).map(([status, data]) => ({
      status,
      count: data.count,
      revenue: data.revenue,
      percentage: totalOrders > 0 ? (data.count / totalOrders) * 100 : 0
    }))

    // Sort by count descending
    distribution.sort((a, b) => b.count - a.count)

    return { success: true, data: distribution, total: totalOrders }
  } catch (error) {
    console.error('Error fetching order status distribution:', error)
    return { success: false, error: 'Failed to fetch order status distribution' }
  }
}

export async function getCustomerGrowthChart(days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()

    // Group by date
    const chartData: { [key: string]: number } = {}

      ; (authUsers?.users as Array<{ created_at: string }> | undefined)
        ?.filter(user => new Date(user.created_at) >= startDate)
        .forEach(user => {
          const date = new Date(user.created_at).toISOString().split('T')[0]
          chartData[date] = (chartData[date] || 0) + 1
        })

    // Calculate cumulative growth
    let cumulative = 0
    const data: ChartDataPoint[] = Object.entries(chartData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => {
        cumulative += value
        return {
          date,
          value: cumulative,
          label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        }
      })

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching customer growth chart:', error)
    return { success: false, error: 'Failed to fetch customer growth data' }
  }
}

export async function exportAnalytics(startDate: Date, endDate: Date) {
  try {
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price,
          product_variants (
            name,
            sku,
            products!product_variants_product_id_fkey (title)
          )
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const csvData = orders?.map(order => ({
      'Order ID': order.id,
      'Date': order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
      'Customer Email': order.user_id || 'Guest',
      'Total Amount': `₹${order.total_amount}`,
      'Status': order.order_status,
      'Payment Status': order.payment_status,
      'Items': order.order_items?.length || 0
    })) || []

    return { success: true, data: csvData }
  } catch (error) {
    console.error('Error exporting analytics:', error)
    return { success: false, error: 'Failed to export analytics' }
  }
}

// Aggregate function for the dashboard
export async function getDashboardAnalytics() {
  try {
    const [stats, recentOrders, lowStockItems, activities] = await Promise.all([
      getDashboardStats(),
      getRecentOrders(5),
      getLowStockItems(10),
      getRecentActivity(10)
    ])

    return {
      success: true,
      data: {
        stats: stats.data || null,
        recentOrders: recentOrders.data || [],
        lowStockItems: lowStockItems.data || [],
        activities: activities.data || [],
        lastUpdated: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    return { success: false, error: 'Failed to fetch dashboard analytics' }
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