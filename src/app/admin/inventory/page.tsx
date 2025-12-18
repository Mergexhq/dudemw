'use client'

import { useState, useEffect } from 'react'
import { InventoryService } from '@/lib/services/inventory'
import { InventoryFilters, InventoryStats } from '@/lib/types/inventory'
import { InventoryTable } from '@/domains/admin/inventory/inventory-table'
import { InventoryFilters as InventoryFiltersComponent } from '@/domains/admin/inventory/inventory-filters'
import { LowStockAlerts } from '@/domains/admin/inventory/low-stock-alerts'
import { BulkImportDialog } from '@/domains/admin/inventory/bulk-import-dialog'
import { InventoryEmptyState } from '@/components/common/empty-states'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CSVService } from '@/lib/services/csv'
import { toast } from 'sonner'
import { Package, AlertTriangle, PackageX, DollarSign, RefreshCw, Plus, Download } from 'lucide-react'
import Link from 'next/link'

export default function InventoryPage() {
  const [inventory, setInventory] = useState<any[]>([])
  const [stats, setStats] = useState<InventoryStats>({
    totalItems: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  })
  const [filters, setFilters] = useState<InventoryFilters>({
    stockStatus: 'all',
  })
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [filters, page])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const result = await InventoryService.getInventoryItems(filters, page, 50)
      if (result.success && result.data) {
        setInventory(result.data)
      } else {
        toast.error(result.error || 'Failed to fetch inventory')
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast.error('Failed to fetch inventory')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await InventoryService.getInventoryStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchInventory(), fetchStats()])
    setIsRefreshing(false)
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

  const hasInventory = inventory.length > 0 || isLoading

  if (!hasInventory && !isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Inventory
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              Monitor stock levels and manage inventory
            </p>
          </div>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25"
            asChild
          >
            <Link href="/admin/products/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Products
            </Link>
          </Button>
        </div>
        <InventoryEmptyState />
      </div>
    )
  }

  return (
    <div className="space-y-8" data-testid="inventory-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Inventory
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
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
          <BulkImportDialog onSuccess={fetchInventory} />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="refresh-inventory-button"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-blue-50 dark:from-gray-900 dark:to-blue-950/20 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Total Items
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {stats.totalItems}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {stats.inStock} in stock
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-yellow-50 dark:from-gray-900 dark:to-yellow-950/20 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Low Stock
            </CardTitle>
            <div className="p-2 rounded-xl bg-yellow-100 dark:bg-yellow-950">
              <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
              {stats.lowStock}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Need restocking</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 dark:from-gray-900 dark:to-red-950/20 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Out of Stock
            </CardTitle>
            <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950">
              <PackageX className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              {stats.outOfStock}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Currently unavailable</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-green-50 dark:from-gray-900 dark:to-green-950/20 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Total Value
            </CardTitle>
            <div className="p-2 rounded-xl bg-green-100 dark:bg-green-950">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              ₹{stats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">Current inventory value</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <LowStockAlerts />

      {/* Filters */}
      <InventoryFiltersComponent
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      {/* Inventory Table */}
      <InventoryTable
        inventory={inventory}
        isLoading={isLoading}
        onRefresh={fetchInventory}
      />
    </div>
  )
}