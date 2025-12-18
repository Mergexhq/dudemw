"use client"

import { useState, useEffect } from "react"
import { OrdersTable } from "@/domains/admin/orders/orders-table"
import { OrdersFilters } from "@/domains/admin/orders/orders-filters"
import { OrdersEmptyState } from "@/components/common/empty-states"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Download, RefreshCw, Package, Clock, Truck, CheckCircle } from "lucide-react"
import { getOrders, getOrderStats, exportOrders, OrderWithDetails, OrderFilters, OrderStats } from "@/lib/actions/orders"
import { toast } from "sonner"

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: '',
    customer: ''
  })

  const fetchOrders = async (page: number = 1, currentFilters: OrderFilters = filters) => {
    try {
      setIsLoading(page === 1)
      const result = await getOrders(currentFilters, page, 20)
      
      if (result.success && result.data) {
        setOrders(result.data)
        setTotalOrders(result.total || 0)
      } else {
        toast.error(result.error || 'Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await getOrderStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching order stats:', error)
    }
  }

  useEffect(() => {
    fetchOrders(1, filters)
    fetchStats()
  }, [])

  const handleFilterChange = (newFilters: OrderFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
    fetchOrders(1, newFilters)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      fetchOrders(currentPage, filters),
      fetchStats()
    ])
    toast.success('Orders refreshed')
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const result = await exportOrders(filters)
      if (result.success && result.data) {
        // Create and download CSV file
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Orders exported successfully')
      } else {
        toast.error(result.error || 'Failed to export orders')
      }
    } catch (error) {
      console.error('Error exporting orders:', error)
      toast.error('Failed to export orders')
    } finally {
      setIsExporting(false)
    }
  }

  const handleCreateOrder = () => {
    // TODO: Implement create order functionality
    console.log("Create order clicked")
    toast.info('Create order functionality coming soon')
  }

  const hasOrders = orders.length > 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Orders</h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage customer orders and fulfillment
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {hasOrders && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          <Button 
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            onClick={handleExport}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25"
            onClick={handleCreateOrder}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </div>
      </div>

      {/* Order Statistics */}
      {stats && (
        <div className="grid gap-6 md:grid-cols-5">
          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-blue-50 border-blue-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-yellow-50 border-yellow-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-purple-50 border-purple-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Processing</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{stats.processing}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-blue-50 border-blue-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Shipped</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{stats.shipped}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-green-50 border-green-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{stats.delivered}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : hasOrders ? (
        <>
          <OrdersFilters 
            filters={filters}
            onFiltersChange={handleFilterChange}
            totalOrders={totalOrders}
          />
          <OrdersTable 
            orders={orders}
            onRefresh={() => fetchOrders(currentPage, filters)}
          />
        </>
      ) : (
        <OrdersEmptyState />
      )}
    </div>
  )
}