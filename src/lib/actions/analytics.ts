"use server"

import prisma from '@/lib/db'
import { subDays } from 'date-fns'
import { getCached, CacheTTL } from '@/lib/cache/server-cache'

export interface DashboardStats {
  revenue: { current: number; previous: number; change: number; changePercent: string }
  orders: { current: number; previous: number; change: number; changePercent: string }
  aov: { current: number; previous: number; change: number; changePercent: string }
  customers: { current: number; previous: number; change: number; changePercent: string }
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

function calculateChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function formatPercentage(change: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}%`
}

export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  return getCached('dashboard:stats', async () => {
    try {
      const now = new Date()
      // Use rolling periods instead of strict calendar months to prevent "day 1 zero-out"
      const current30Start = subDays(now, 30)
      const current30End = now
      const previous30Start = subDays(now, 60)
      const previous30End = subDays(now, 30)

      const current7Start = subDays(now, 7)
      const current7End = now
      const previous7Start = subDays(now, 14)
      const previous7End = subDays(now, 7)

      const [currentMonthOrders, previousMonthOrders, currentWeekOrders, previousWeekOrders, currentMonthCustomers, previousMonthCustomers] = await Promise.all([
        prisma.orders.findMany({
          where: { created_at: { gte: current30Start, lte: current30End }, NOT: { order_status: 'cancelled' } },
          select: { total_amount: true },
        }),
        prisma.orders.findMany({
          where: { created_at: { gte: previous30Start, lte: previous30End }, NOT: { order_status: 'cancelled' } },
          select: { total_amount: true },
        }),
        prisma.orders.count({ where: { created_at: { gte: current7Start, lte: current7End }, NOT: { order_status: 'cancelled' } } }),
        prisma.orders.count({ where: { created_at: { gte: previous7Start, lte: previous7End }, NOT: { order_status: 'cancelled' } } }),
        prisma.orders.findMany({
          where: { created_at: { gte: current30Start, lte: current30End } },
          select: { guest_email: true, user_id: true },
        }),
        prisma.orders.findMany({
          where: { created_at: { gte: previous30Start, lte: previous30End } },
          select: { guest_email: true, user_id: true },
        }),
      ])

      const currentRevenue = currentMonthOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
      const previousRevenue = previousMonthOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
      const revenueChange = calculateChange(currentRevenue, previousRevenue)

      const ordersChange = calculateChange(currentWeekOrders, previousWeekOrders)
      const currentAOV = currentMonthOrders.length ? currentRevenue / currentMonthOrders.length : 0
      const previousAOV = previousMonthOrders.length ? previousRevenue / previousMonthOrders.length : 0
      const aovChange = calculateChange(currentAOV, previousAOV)

      const currentUniqueCustomers = new Set(currentMonthCustomers.map(c => c.guest_email || c.user_id).filter(Boolean)).size
      const previousUniqueCustomers = new Set(previousMonthCustomers.map(c => c.guest_email || c.user_id).filter(Boolean)).size
      const customersChange = calculateChange(currentUniqueCustomers, previousUniqueCustomers)

      const stats: DashboardStats = {
        revenue: { current: currentRevenue, previous: previousRevenue, change: revenueChange, changePercent: formatPercentage(revenueChange) },
        orders: { current: currentWeekOrders, previous: previousWeekOrders, change: ordersChange, changePercent: formatPercentage(ordersChange) },
        aov: { current: currentAOV, previous: previousAOV, change: aovChange, changePercent: formatPercentage(aovChange) },
        customers: { current: currentUniqueCustomers, previous: previousUniqueCustomers, change: customersChange, changePercent: formatPercentage(customersChange) },
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return { success: false, error: 'Failed to fetch dashboard statistics' }
    }
  }, CacheTTL.STATS)
}

export async function getRecentOrders(limit: number = 5): Promise<{ success: boolean; data?: RecentOrder[]; error?: string }> {
  return getCached(`analytics:recent-orders:${limit}`, async () => {
    try {
      const orders = await prisma.orders.findMany({
        orderBy: { created_at: 'desc' },
        take: limit,
        select: {
          id: true,
          guest_email: true,
          customer_name_snapshot: true,
          total_amount: true,
          order_status: true,
          created_at: true,
          _count: { select: { order_items: true } },
        },
      })

      const recentOrders: RecentOrder[] = orders.map(order => ({
        id: order.id,
        order_number: `ORD-${order.id.slice(-6).toUpperCase()}`,
        customer_name: order.customer_name_snapshot || 'Guest Customer',
        customer_email: order.guest_email || '',
        total_amount: Number(order.total_amount || 0),
        status: order.order_status || 'pending',
        created_at: order.created_at?.toISOString() || new Date().toISOString(),
        items_count: order._count.order_items,
      }))

      return { success: true, data: recentOrders }
    } catch (error) {
      console.error('Error fetching recent orders:', error)
      return { success: false, error: 'Failed to fetch recent orders' }
    }
  }, 60)
}

export async function getLowStockItems(limit: number = 10): Promise<{ success: boolean; data?: LowStockItem[]; error?: string }> {
  return getCached(`analytics:low-stock:${limit}`, async () => {
    try {
      const items = await prisma.inventory_items.findMany({
        where: { quantity: { lte: 20 } },
        include: {
          product_variants: {
            include: {
              product: { select: { title: true } },
            },
          },
        },
        orderBy: { quantity: 'asc' },
      })

      const lowStockItems: LowStockItem[] = items
        .filter(item => (item.quantity || 0) <= (item.low_stock_threshold || 5))
        .slice(0, limit)
        .map(item => ({
          id: item.id,
          product_title: (item.product_variants as any)?.product?.title || 'Unknown Product',
          variant_name: item.product_variants?.name || 'Default Variant',
          sku: item.sku || '',
          current_stock: item.quantity || 0,
          low_stock_threshold: item.low_stock_threshold || 5,
          status: (item.quantity || 0) === 0 ? 'out_of_stock' : 'low_stock',
        }))

      return { success: true, data: lowStockItems }
    } catch (error) {
      console.error('Error fetching low stock items:', error)
      return { success: false, error: 'Failed to fetch low stock items' }
    }
  }, CacheTTL.STATS)
}

export async function getRecentActivity(limit: number = 10): Promise<{ success: boolean; data?: RecentActivity[]; error?: string }> {
  try {
    const [recentOrders, recentProducts, recentInventory] = await Promise.all([
      prisma.orders.findMany({
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { id: true, guest_email: true, total_amount: true, created_at: true },
      }),
      prisma.products.findMany({
        orderBy: { created_at: 'desc' },
        take: 3,
        select: { id: true, title: true, created_at: true },
      }),
      prisma.inventory_logs.findMany({
        orderBy: { created_at: 'desc' },
        take: 3,
        select: { id: true, change_amount: true, reason: true, created_at: true },
      }).catch(() => []),
    ])

    const activities: RecentActivity[] = []

    recentOrders.forEach(order => {
      if (order.created_at) {
        activities.push({
          id: `order-${order.id}`,
          type: 'order_placed',
          description: `New order #${order.id.slice(-6)} placed by ${order.guest_email || 'Guest'} for ₹${Number(order.total_amount || 0).toLocaleString()}`,
          timestamp: order.created_at.toISOString(),
          metadata: { orderId: order.id, amount: Number(order.total_amount || 0) },
        })
      }
    })

    recentProducts.forEach(product => {
      if (product.created_at) {
        activities.push({
          id: `product-${product.id}`,
          type: 'product_created',
          description: `New product "${product.title}" was added to catalog`,
          timestamp: product.created_at.toISOString(),
          metadata: { productId: product.id },
        })
      }
    })

    recentInventory.forEach(log => {
      if (log.created_at) {
        activities.push({
          id: `inventory-${log.id}`,
          type: 'inventory_updated',
          description: `Inventory updated: ${log.change_amount > 0 ? '+' : ''}${log.change_amount} units (${log.reason || 'Manual adjustment'})`,
          timestamp: log.created_at.toISOString(),
          metadata: { change: log.change_amount },
        })
      }
    })

    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)

    return { success: true, data: sortedActivities }
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return { success: false, error: 'Failed to fetch recent activity' }
  }
}

export async function getRevenueChart(period: 'daily' | 'weekly' | 'monthly' = 'daily', days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const orders = await prisma.orders.findMany({
      where: { created_at: { gte: startDate } },
      select: { total_amount: true, created_at: true },
      orderBy: { created_at: 'asc' },
    })

    const chartData: { [key: string]: number } = {}

    orders.forEach(order => {
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

      chartData[key] = (chartData[key] || 0) + Number(order.total_amount || 0)
    })

    const data: ChartDataPoint[] = Object.entries(chartData).map(([date, value]) => ({
      date,
      value,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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

    const orders = await prisma.orders.findMany({
      where: { created_at: { gte: startDate } },
      select: { id: true, created_at: true },
      orderBy: { created_at: 'asc' },
    })

    const chartData: { [key: string]: number } = {}

    orders.forEach(order => {
      if (!order.created_at) return
      const date = new Date(order.created_at).toISOString().split('T')[0]
      chartData[date] = (chartData[date] || 0) + 1
    })

    const data: ChartDataPoint[] = Object.entries(chartData).map(([date, value]) => ({
      date,
      value,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    }))

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching orders chart:', error)
    return { success: false, error: 'Failed to fetch orders chart data' }
  }
}

export async function getTopProducts(limit: number = 10) {
  return getCached(`analytics:top-products:${limit}`, async () => {
    try {
      // Aggregate revenue per product via order_items → product_variants → products
      const orderItems = await prisma.order_items.findMany({
        include: {
          product_variants: {
            include: {
              product: {
                select: { id: true, title: true },
              },
            },
          },
        },
      })

      const productMap = new Map<string, { id: string; title: string; revenue: number; orders: Set<string>; image_url?: string }>()

      orderItems.forEach(item => {
        const product = (item.product_variants as any)?.product
        if (!product) return
        const existing = productMap.get(product.id) || { id: product.id, title: product.title, revenue: 0, orders: new Set() }
        existing.revenue += Number(item.price || 0) * item.quantity
        existing.orders.add(item.order_id)
        productMap.set(product.id, existing)
      })

      const topProducts: TopProduct[] = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
        .map(p => ({ id: p.id, title: p.title, revenue: p.revenue, orders: p.orders.size, image_url: p.image_url }))

      return { success: true, data: topProducts }
    } catch (error) {
      console.error('Error fetching top products:', error)
      return { success: false, error: 'Failed to fetch top products' }
    }
  }, CacheTTL.ANALYTICS)
}

export async function getCategoryPerformance() {
  return getCached('analytics:category-performance', async () => {
    try {
      const categories = await prisma.categories.findMany({
        select: {
          id: true,
          name: true,
          product_categories: {
            select: { product_id: true },
          },
        },
      })

      const performance: CategoryPerformance[] = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        revenue: 0,
        orders: 0,
        products: cat.product_categories.length,
      }))

      return { success: true, data: performance }
    } catch (error) {
      console.error('Error fetching category performance:', error)
      return { success: false, error: 'Failed to fetch category performance' }
    }
  }, CacheTTL.ANALYTICS)
}

export interface OrderStatusData {
  status: string
  count: number
  revenue: number
  percentage: number
}

export async function getOrderStatusDistribution() {
  try {
    const orders = await prisma.orders.findMany({
      select: { order_status: true, total_amount: true },
    })

    const statusMap = new Map<string, { count: number; revenue: number }>()
    let totalOrders = 0

    orders.forEach(order => {
      const status = order.order_status || 'unknown'
      const existing = statusMap.get(status) || { count: 0, revenue: 0 }
      statusMap.set(status, { count: existing.count + 1, revenue: existing.revenue + Number(order.total_amount || 0) })
      totalOrders++
    })

    const distribution: OrderStatusData[] = Array.from(statusMap.entries())
      .map(([status, data]) => ({
        status,
        count: data.count,
        revenue: data.revenue,
        percentage: totalOrders > 0 ? (data.count / totalOrders) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count)

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

    // Use customers table as a proxy for growth (Clerk manages auth users)
    const customers = await prisma.customers.findMany({
      where: { created_at: { gte: startDate } },
      select: { created_at: true },
      orderBy: { created_at: 'asc' },
    })

    const chartData: { [key: string]: number } = {}

    customers.forEach(customer => {
      if (!customer.created_at) return
      const date = new Date(customer.created_at).toISOString().split('T')[0]
      chartData[date] = (chartData[date] || 0) + 1
    })

    let cumulative = 0
    const data: ChartDataPoint[] = Object.entries(chartData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => {
        cumulative += value
        return {
          date,
          value: cumulative,
          label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
    const orders = await prisma.orders.findMany({
      where: { created_at: { gte: startDate, lte: endDate } },
      include: {
        order_items: {
          include: {
            product_variants: {
              include: {
                product: { select: { title: true } },
              },
            },
          },
        },
      },
    })

    const csvData = orders.map(order => ({
      'Order ID': order.id,
      'Date': order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A',
      'Customer Email': order.guest_email || order.customer_email_snapshot || 'Guest',
      'Total Amount': `₹${order.total_amount}`,
      'Status': order.order_status,
      'Payment Status': order.payment_status,
      'Items': order.order_items?.length || 0,
    }))

    return { success: true, data: csvData }
  } catch (error) {
    console.error('Error exporting analytics:', error)
    return { success: false, error: 'Failed to export analytics' }
  }
}

export async function getDashboardAnalytics() {
  try {
    const [stats, recentOrders, lowStockItems, activities] = await Promise.all([
      getDashboardStats(),
      getRecentOrders(5),
      getLowStockItems(10),
      getRecentActivity(10),
    ])

    return {
      success: true,
      data: {
        stats: stats.data || null,
        recentOrders: recentOrders.data || [],
        lowStockItems: lowStockItems.data || [],
        activities: activities.data || [],
        lastUpdated: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    return { success: false, error: 'Failed to fetch dashboard analytics' }
  }
}

// Real-time subscriptions are not supported with Prisma/Neon.
// Use polling or webhooks instead.
export async function subscribeToOrderUpdates(_callback: (payload: any) => void) {
  console.warn('Real-time subscriptions are not available with Prisma/Neon. Use polling instead.')
  return null
}