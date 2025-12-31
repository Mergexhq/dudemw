"use client"

import { useState, useMemo } from "react"
import {
  updateOrderStatus,
  bulkUpdateOrderStatus,
  addTrackingInfo,
  cancelOrder,
  exportOrders
} from "@/lib/actions/orders"
import { OrdersTable } from "@/domains/admin/orders/orders-table"
import { OrdersEmptyState } from "@/components/common/empty-states"
import { AdminFilters, FilterConfig, ActiveFilterChip } from "@/components/admin/filters/AdminFilters"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, RefreshCw, Package, Clock, Truck, CheckCircle, FileText, CreditCard } from "lucide-react"
import { useOrders, useOrderStats } from "@/hooks/queries/useOrders"
import { useAdminFilters } from "@/hooks/useAdminFilters"
import { getActiveFiltersWithLabels } from "@/lib/utils/filter-utils"
import { toast } from "sonner"

const DEFAULT_FILTERS = {
  search: "",
  status: "all",
  paymentStatus: "all",
}

export default function OrdersPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isDownloadingLabels, setIsDownloadingLabels] = useState(false)

  // Filter management with URL params
  const {
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
  } = useAdminFilters({
    defaultFilters: DEFAULT_FILTERS,
    onFilterChange: () => setCurrentPage(1),
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

  const handleRefresh = async () => {
    await Promise.all([refetchOrders(), refetchStats()])
    toast.success('Orders refreshed')
  }

  // Filter configuration
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: "status",
      label: "Order Status",
      placeholder: "All Status",
      options: [
        { value: "all", label: "All Status" },
        { value: "pending", label: "Pending" },
        { value: "processing", label: "Processing" },
        { value: "shipped", label: "Shipped" },
        { value: "delivered", label: "Delivered" },
        { value: "cancelled", label: "Cancelled" },
      ],
      icon: Package,
      width: "w-[140px]",
    },
    {
      key: "paymentStatus",
      label: "Payment Status",
      placeholder: "All Payments",
      options: [
        { value: "all", label: "All Payments" },
        { value: "paid", label: "Paid" },
        { value: "pending", label: "Pending" },
        { value: "failed", label: "Failed" },
        { value: "refunded", label: "Refunded" },
      ],
      icon: CreditCard,
      width: "w-[140px]",
    },
  ], [])

  // Active filter chips
  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    return getActiveFiltersWithLabels(filters, DEFAULT_FILTERS).map(filter => ({
      key: filter.key,
      label: filter.label,
      value: filter.value,
    }))
  }, [filters])

  const handleExport = async () => {
    try {
      const result = await exportOrders({
        search: filters.search || "",
        status: filters.status || "all",
        paymentStatus: filters.paymentStatus || "all",
        dateFrom: filters.dateFrom || "",
        dateTo: filters.dateTo || "",
        customer: filters.customer || ""
      })

      if (result.success && result.data) {
        // Create blob and download
        const blob = new Blob([result.data], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success('Orders exported successfully')
      } else {
        toast.error(result.error || 'Failed to export orders')
      }
    } catch (error) {
      console.error('Error exporting orders:', error)
      toast.error('Failed to export orders')
    }
  }

  const handleBulkDownloadLabels = async () => {
    if (selectedOrders.length === 0) {
      toast.error('Please select at least one order')
      return
    }

    setIsDownloadingLabels(true)
    try {
      const response = await fetch('/api/admin/orders/bulk-labels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderIds: selectedOrders }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate labels')
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `shipping-labels-bulk-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Downloaded ${selectedOrders.length} shipping label(s)`)
      setSelectedOrders([])
    } catch (error) {
      console.error('Bulk download labels error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to download labels')
    } finally {
      setIsDownloadingLabels(false)
    }
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
            size="sm"
            className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
            onClick={handleBulkDownloadLabels}
            disabled={isDownloadingLabels || selectedOrders.length === 0}
            data-testid="bulk-download-labels-btn"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isDownloadingLabels
              ? 'Generating...'
              : selectedOrders.length > 0
                ? `Bulk Labels (${selectedOrders.length})`
                : 'Bulk Labels'
            }
          </Button>
          <Button
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
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
      ) : (
        <>
          <AdminFilters
            searchValue={filters.search}
            onSearchChange={(value) => setFilter("search", value)}
            searchPlaceholder="Search orders..."
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={setFilter}
            onClearAll={clearFilters}
            activeFilters={activeFilterChips}
            totalCount={orders.length}
            isLoading={isLoading}
            showActiveChips={true}
          />

          {hasOrders ? (
            <OrdersTable
              orders={orders}
              onRefresh={refetchOrders}
              selectedOrders={selectedOrders}
              onSelectionChange={setSelectedOrders}
            />
          ) : (
            <OrdersEmptyState />
          )}
        </>
      )}
    </div>
  )
}
