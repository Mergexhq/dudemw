'use client'

import { useState } from 'react'
import { InventoryFilters } from '@/lib/types/inventory'
import { InventoryTable } from '@/domains/admin/inventory/inventory-table'
import { InventoryFilters as InventoryFiltersComponent } from '@/domains/admin/inventory/inventory-filters'
import { LowStockAlerts } from '@/domains/admin/inventory/low-stock-alerts'
import { BulkImportDialog } from '@/domains/admin/inventory/bulk-import-dialog'
import { InventoryEmptyState } from '@/components/common/empty-states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CSVService } from '@/lib/services/csv'
import { toast } from 'sonner'
import { Package, AlertTriangle, PackageX, IndianRupee, RefreshCw, Plus, Download } from 'lucide-react'
import Link from 'next/link'
import { useInventory, useInventoryStats, useLowStockAlerts } from '@/hooks/queries/useInventory'
import { formatCurrency } from '@/lib/utils'

export default function InventoryPage() {
  const [filters, setFilters] = useState<InventoryFilters>({
    stockStatus: 'all',
  })
  const [page, setPage] = useState(1)

  // React Query hooks
  const {
    data: inventory = [],
    isLoading,
    refetch: refetchInventory
  } = useInventory(filters, page, 1000)

  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useInventoryStats()

  const {
    data: lowStockItems = [],
    isLoading: isLoadingLowStock,
    refetch: refetchLowStock
  } = useLowStockAlerts()

  const handleRefresh = async () => {
    await Promise.all([refetchInventory(), refetchStats(), refetchLowStock()])
    toast.success('Inventory refreshed')
  }

  const handleFiltersChange = (newFilters: InventoryFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleExport = () => {
    if (inventory.length === 0) {
      toast.error('No inventory items to export')
      return
    }
    const csv = CSVService.exportInventoryToCSV(inventory)
    CSVService.downloadCSV(csv, `inventory-export-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Inventory exported successfully')
  }

  const hasInventory = inventory.length > 0

  return (
    <div className="space-y-8" data-testid="inventory-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Inventory
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Monitor stock levels and manage inventory
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleExport}
            data-testid="export-inventory-button"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <BulkImportDialog onSuccess={refetchInventory} />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading || isLoadingStats}
            data-testid="refresh-inventory-button"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || isLoadingStats) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      ) : hasInventory ? (
        <>
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-blue-50 hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Total Items
                </CardTitle>
                <div className="p-2 rounded-xl bg-blue-100">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stats?.totalItems || 0}
                </div>
                <p className="text-xs text-gray-600">
                  {stats?.inStock || 0} in stock
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-yellow-50 hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Low Stock
                </CardTitle>
                <div className="p-2 rounded-xl bg-yellow-100">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {stats?.lowStock || 0}
                </div>
                <p className="text-xs text-gray-600">Need restocking</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Out of Stock
                </CardTitle>
                <div className="p-2 rounded-xl bg-red-100">
                  <PackageX className="h-4 w-4 text-red-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {stats?.outOfStock || 0}
                </div>
                <p className="text-xs text-gray-600">Currently unavailable</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-green-50 hover:shadow-md transition-all duration-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  Total Value
                </CardTitle>
                <div className="p-2 rounded-xl bg-green-100">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {formatCurrency(stats?.totalValue || 0)}
                </div>
                <p className="text-xs text-gray-600">Current inventory value</p>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alerts */}
          <LowStockAlerts items={lowStockItems} isLoading={isLoadingLowStock} showViewButton={false} />

          {/* Filters */}
          <InventoryFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
          />

          {/* Inventory Table */}
          <InventoryTable
            inventory={inventory}
            isLoading={isLoading}
            onRefresh={refetchInventory}
          />
        </>
      ) : (
        <InventoryEmptyState />
      )}
    </div>
  )
}
