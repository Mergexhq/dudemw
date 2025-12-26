"use client"

import { Suspense, lazy } from "react"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useDashboardAnalytics } from "@/hooks/queries/useAnalytics"
import { toast } from "sonner"

// Lazy load dashboard components
const DashboardStats = lazy(() => import("@/domains/admin/dashboard/dashboard-stats").then(mod => ({ default: mod.DashboardStats })))
const RecentOrders = lazy(() => import("@/domains/admin/dashboard/recent-orders").then(mod => ({ default: mod.RecentOrders })))
const LowStockAlerts = lazy(() => import("@/domains/admin/inventory/low-stock-alerts").then(mod => ({ default: mod.LowStockAlerts })))
const RecentActivity = lazy(() => import("@/domains/admin/dashboard/recent-activity").then(mod => ({ default: mod.RecentActivity })))

// Lazy load chart components (heavy Recharts dependency)
const RevenueChart = lazy(() => import("@/domains/admin/dashboard/revenue-chart").then(mod => ({ default: mod.RevenueChart })))
const OrdersChart = lazy(() => import("@/domains/admin/dashboard/orders-chart").then(mod => ({ default: mod.OrdersChart })))
const TopProducts = lazy(() => import("@/domains/admin/dashboard/top-products").then(mod => ({ default: mod.TopProducts })))
const CategoryPerformance = lazy(() => import("@/domains/admin/dashboard/category-performance").then(mod => ({ default: mod.CategoryPerformance })))

// Loading fallback component
const ChartSkeleton = () => (
  <div className="rounded-lg border bg-card p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="h-64 bg-gray-100 rounded"></div>
  </div>
)

const ComponentSkeleton = () => (
  <div className="rounded-lg border bg-card p-6 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 bg-gray-100 rounded"></div>
      ))}
    </div>
  </div>
)

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
    <div className="space-y-4 md:space-y-8" data-testid="admin-dashboard">
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="text-sm md:text-lg text-gray-600 mt-1 md:mt-2">
            Business health and action center
          </p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {hasData && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
                className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 min-h-[44px] px-4"
                data-testid="refresh-dashboard-button"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              {dashboardData?.lastUpdated && (
                <div className="hidden lg:block text-right">
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

      <Suspense fallback={<ComponentSkeleton />}>
        <DashboardStats stats={stats} isLoading={isLoading} hasError={hasStatsError} />
      </Suspense>

      {/* Analytics Charts - Lazy loaded to reduce initial bundle */}
      {!isLoading && hasData && (
        <>
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
            <Suspense fallback={<ChartSkeleton />}>
              <RevenueChart />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <OrdersChart />
            </Suspense>
          </div>
          <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2">
            <Suspense fallback={<ChartSkeleton />}>
              <TopProducts />
            </Suspense>
            <Suspense fallback={<ChartSkeleton />}>
              <CategoryPerformance />
            </Suspense>
          </div>
        </>
      )}

      {isLoading ? (
        <div className="space-y-8">
          <ComponentSkeleton />
          <ComponentSkeleton />
          <ComponentSkeleton />
        </div>
      ) : hasData ? (
        <div className="space-y-8">
          <Suspense fallback={<ComponentSkeleton />}>
            <RecentOrders orders={recentOrders} />
          </Suspense>
          <Suspense fallback={<ComponentSkeleton />}>
            <LowStockAlerts items={lowStockItems} />
          </Suspense>
          <Suspense fallback={<ComponentSkeleton />}>
            <RecentActivity activities={activities} />
          </Suspense>
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
            <div className="flex flex-col gap-3 justify-center">
              <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 min-h-[44px]" asChild>
                <Link href="/admin/products/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Button>
              <Button variant="outline" className="min-h-[44px]" asChild>
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
