"use client"

import { useState, useEffect } from "react"
import { DashboardStats } from "@/domains/admin/dashboard/dashboard-stats"
import { RecentOrders } from "@/domains/admin/dashboard/recent-orders"
import { LowStockAlerts } from "@/domains/admin/inventory/low-stock-alerts"
import { RecentActivity } from "@/domains/admin/dashboard/recent-activity"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { 
  getDashboardStats, 
  getRecentOrders, 
  getLowStockItems, 
  getRecentActivity,
  DashboardStats as DashboardStatsType,
  RecentOrder,
  LowStockItem,
  RecentActivity as RecentActivityType
} from "@/lib/actions/analytics"
import { toast } from "sonner"

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStatsType | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [activities, setActivities] = useState<RecentActivityType[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasStatsError, setHasStatsError] = useState(false)

  const fetchDashboardData = async () => {
    try {
      const [statsResult, ordersResult, stockResult, activityResult] = await Promise.all([
        getDashboardStats(),
        getRecentOrders(5),
        getLowStockItems(10),
        getRecentActivity(10)
      ])

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data)
        setHasStatsError(false)
      } else {
        console.error('Failed to fetch stats:', statsResult.error)
        setHasStatsError(true)
        // Set stats to null to show empty state instead of error
        setStats(null)
      }

      if (ordersResult.success && ordersResult.data) {
        setRecentOrders(ordersResult.data)
      } else {
        console.error('Failed to fetch orders:', ordersResult.error)
      }

      if (stockResult.success && stockResult.data) {
        setLowStockItems(stockResult.data)
      } else {
        console.error('Failed to fetch stock items:', stockResult.error)
      }

      if (activityResult.success && activityResult.data) {
        setActivities(activityResult.data)
      } else {
        console.error('Failed to fetch activities:', activityResult.error)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setHasStatsError(true)
      // Show a general error but let individual components handle their empty states gracefully
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const refreshData = async () => {
    setIsRefreshing(true)
    await fetchDashboardData()
    toast.success('Dashboard data refreshed')
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const hasData = recentOrders.length > 0 || lowStockItems.length > 0 || activities.length > 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-lg text-gray-600 mt-2">
            Business health and action center
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {hasData && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={isRefreshing}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <div className="text-right">
                <p className="text-sm text-gray-500">Last updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
                </p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </>
          )}
        </div>
      </div>
      
      <DashboardStats stats={stats} isLoading={isLoading} hasError={hasStatsError} />
      
      {isLoading ? (
        <div className="space-y-8">
          <RecentOrders orders={[]} isLoading={true} />
          <LowStockAlerts items={[]} isLoading={true} />
          <RecentActivity activities={[]} isLoading={true} />
        </div>
      ) : hasData ? (
        <div className="space-y-8">
          <RecentOrders orders={recentOrders} />
          <LowStockAlerts items={lowStockItems} />
          <RecentActivity activities={activities} />
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Welcome to your dashboard
            </h3>
            <p className="text-gray-600 mb-6">
              Start by adding your first product or creating an order to see your business data here.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25" asChild>
                <Link href="/admin/products/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/admin/orders">
                  View Orders
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}