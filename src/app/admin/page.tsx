"use client"

import { DashboardStats } from "@/domains/admin/dashboard/dashboard-stats"
import { RecentOrders } from "@/domains/admin/dashboard/recent-orders"
import { LowStockAlerts } from "@/domains/admin/inventory/low-stock-alerts"
import { RecentActivity } from "@/domains/admin/dashboard/recent-activity"
import { RevenueChart } from "@/domains/admin/dashboard/revenue-chart"
import { OrdersChart } from "@/domains/admin/dashboard/orders-chart"
import { TopProducts } from "@/domains/admin/dashboard/top-products"
import { CategoryPerformance } from "@/domains/admin/dashboard/category-performance"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useDashboardAnalytics } from "@/hooks/queries/useAnalytics"
import { toast } from "sonner"

export default function AdminDashboard() {
  // React Query hook for dashboard data
  const { 
    data: dashboardData, 
    isLoading,
    refetch: refetchDashboard 
  } = useDashboardAnalytics()

  const stats = dashboardData?.stats
  const recentOrders = dashboardData?.recentOrders || []
  const lowStockItems = dashboardData?.lowStockItems || []
  const activities = dashboardData?.activities || []
  const hasStatsError = !isLoading && !stats

  const handleRefresh = async () => {
    await refetchDashboard()
    toast.success('Dashboard data refreshed')
  }

  const hasData = recentOrders.length > 0 || lowStockItems.length > 0 || activities.length > 0

  return (
    <div className="space-y-8" data-testid="admin-dashboard">
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
                onClick={handleRefresh}
                disabled={isLoading}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                data-testid="refresh-dashboard-button"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {dashboardData?.lastUpdated && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Last updated</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(dashboardData.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
              )}
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </>
          )}
        </div>
      </div>
      
      <DashboardStats stats={stats} isLoading={isLoading} hasError={hasStatsError} />
      
      {/* Analytics Charts */}
      {!isLoading && hasData && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <RevenueChart />
            <OrdersChart />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <TopProducts />
            <CategoryPerformance />
          </div>
        </>
      )}
      
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
