"use client"

import { useState } from "react"
import { OrdersTable } from "@/domains/admin/orders/orders-table"
import { OrdersFilters } from "@/domains/admin/orders/orders-filters"
import { OrdersEmptyState } from "@/components/common/empty-states"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Download, RefreshCw, Package, Clock, Truck, CheckCircle } from "lucide-react"
import { useOrders, useOrderStats } from "@/hooks/queries/useOrders"
import { toast } from "sonner"

interface OrderFilters {
  search: string
  status: string
  paymentStatus: string
  dateFrom: string
  dateTo: string
  customer: string
}

export default function OrdersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    dateFrom: '',
    dateTo: '',
    customer: ''
  })

  // React Query hooks
  const { 
    data: orders = [], 
    isLoading,
    refetch: refetchOrders 
  } = useOrders(filters)
  
  const { 
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats 
  } = useOrderStats()

  const handleFilterChange = (newFilters: OrderFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleRefresh = async () => {
    await Promise.all([refetchOrders(), refetchStats()])
    toast.success('Orders refreshed')
  }

  const handleExport = async () => {
    try {
      // TODO: Implement export functionality using the query data
      toast.info('Export functionality coming soon')
    } catch (error) {
      console.error('Error exporting orders:', error)
      toast.error('Failed to export orders')
    }
  }

  const handleCreateOrder = () => {
    toast.info('Create order functionality coming soon')
  }

  const hasOrders = orders.length > 0

  return (
    <div className="space-y-8" data-testid="orders-page">
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
              disabled={isLoading || isLoadingStats}
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              data-testid="refresh-orders-button"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${(isLoading || isLoadingStats) ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          )}
          <Button 
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
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
              <div className="text-2xl font-bold text-gray-900">{stats.total || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-yellow-50 border-yellow-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{stats.pending || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-purple-50 border-purple-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Processing</CardTitle>
              <Package className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{stats.processing || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-blue-50 border-blue-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Shipped</CardTitle>
              <Truck className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{stats.shipped || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-green-50 border-green-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Delivered</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{stats.delivered || 0}</div>
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
            totalOrders={orders.length}
          />
          <OrdersTable 
            orders={orders}
            onRefresh={refetchOrders}
          />
        </>
      ) : (
        <OrdersEmptyState />
      )}
    </div>
  )
}
