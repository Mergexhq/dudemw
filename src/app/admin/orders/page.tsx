"use client"

import { useState, useEffect } from "react"
import {
  updateOrderStatus,
  bulkUpdateOrderStatus,
  addTrackingInfo,
  cancelOrder,
} from "@/lib/actions/orders"
import { OrdersTable } from "@/domains/admin/orders/orders-table"
import { OrdersEmptyState } from "@/components/common/empty-states"
import { FilterBar } from "@/components/admin/filters"
import { ExportOrdersDialog } from "@/domains/admin/orders/ExportOrdersDialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Package, Clock, Truck, CheckCircle, FileText } from "lucide-react"
import { useOrders, useOrderStats } from "@/hooks/queries/useOrders"
import { useAdminFilters, FilterConfig } from "@/hooks/use-admin-filters"
import { toast } from "sonner"

export default function OrdersPage() {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [isDownloadingLabels, setIsDownloadingLabels] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const PAGE_SIZE = 20

  // searchQuery is the live typing state; search is committed on submit
  const [search, setSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchSubmit = () => { setSearch(searchQuery); setCurrentPage(1) }
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchSubmit()
  }

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'order_status',
      label: 'Order Status',
      type: 'enum',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
    },
    {
      key: 'payment_status',
      label: 'Payment Status',
      type: 'enum',
      options: [
        { label: 'Paid', value: 'paid' },
        { label: 'Pending', value: 'pending' },
        { label: 'Failed', value: 'failed' },
        { label: 'Expired', value: 'expired' },
        { label: 'Refunded', value: 'refunded' },
      ],
    },
  ]

  // Quick filters (shown in main bar)
  const quickFilters = filterConfigs // All filters are quick filters now

  // Advanced filters (shown in drawer)


  // Initialize filters hook
  const {
    filters,
    setFilter: _setFilter,
    removeFilter: _removeFilter,
    clearFilters: _clearFilters,
    applyFilters,
    activeFilters,
    activeCount,
  } = useAdminFilters({
    configs: filterConfigs,
    defaultFilters: {},
  })

  // Wrap filter mutations to always reset pagination to page 1
  const setFilter = (key: string, value: any) => { _setFilter(key, value); setCurrentPage(1) }
  const removeFilter = (key: string) => { _removeFilter(key); setCurrentPage(1) }
  const clearFilters = () => { _clearFilters(); setCurrentPage(1) }

  // React Query hooks - passes filters to backend
  const {
    data: ordersResult,
    isLoading,
    refetch: refetchOrders
  } = useOrders({
    search,
    ...filters,
  }, currentPage, PAGE_SIZE)

  const orders = ordersResult?.orders ?? []
  const pagination = ordersResult?.pagination

  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useOrderStats()

  // Auto-expire old pending orders when page loads
  useEffect(() => {
    const autoExpireOrders = async () => {
      try {
        const response = await fetch('/api/admin/orders/auto-expire', {
          method: 'POST',
        })
        const result = await response.json()

        if (result.success && result.expired > 0) {
          console.log(`Auto-expired ${result.expired} old orders`)
          // Silently refresh orders to show updated statuses
          refetchOrders()
          refetchStats()
        }
      } catch (error) {
        console.error('Auto-expire error:', error)
        // Fail silently - don't disrupt user experience
      }
    }

    autoExpireOrders()
  }, []) // Run once on mount

  const handleRefresh = async () => {
    await Promise.all([refetchOrders(), refetchStats()])
    toast.success('Orders refreshed')
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
      {/* Header */}
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
          <ExportOrdersDialog
            filters={filters as any}
            search={search}
          />
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
          {/* Filter Bar */}
          <FilterBar
            search={searchQuery}
            onSearchChange={setSearchQuery}
            onSearchSubmit={handleSearchSubmit}
            onSearchKeyDown={handleSearchKeyDown}
            searchPlaceholder="Search orders..."
            quickFilters={quickFilters}
            filterValues={filters}
            onFilterChange={setFilter}
            activeFilters={activeFilters}
            onRemoveFilter={removeFilter}
            activeFilterCount={activeCount}
            onClearAll={clearFilters}
          />

          {/* Orders Table */}
          {hasOrders ? (
            <>
              <OrdersTable
                orders={orders}
                onRefresh={refetchOrders}
                selectedOrders={selectedOrders}
                onSelectionChange={setSelectedOrders}
              />

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-1 py-3">
                  <p className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, pagination.total)} of {pagination.total} orders
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => { setCurrentPage(p => p - 1); setSelectedOrders([]) }}
                      disabled={currentPage === 1}
                      className="h-8 px-3"
                    >
                      ← Prev
                    </Button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1)
                      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...')
                        acc.push(p)
                        return acc
                      }, [])
                      .map((p, i) =>
                        p === '...' ? (
                          <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
                        ) : (
                          <Button
                            key={p}
                            variant={currentPage === p ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => { setCurrentPage(p as number); setSelectedOrders([]) }}
                            className="h-8 w-8 p-0"
                          >
                            {p}
                          </Button>
                        )
                      )
                    }
                    <Button
                      variant="outline" size="sm"
                      onClick={() => { setCurrentPage(p => p + 1); setSelectedOrders([]) }}
                      disabled={currentPage === pagination.totalPages}
                      className="h-8 px-3"
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <OrdersEmptyState />
          )}
        </>
      )}
    </div>
  )
}
