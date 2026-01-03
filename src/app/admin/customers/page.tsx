'use client'

import { useState } from 'react'
import { CustomerFilters } from '@/lib/types/customers'
import { CustomersTable } from '@/domains/admin/customers/customers-table'
import { CustomersStats } from '@/domains/admin/customers/customers-stats'
import { CustomersEmptyState } from '@/components/common/empty-states'
import { FilterBar, FilterDrawer } from '@/components/admin/filters'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw, Download } from 'lucide-react'
import { useCustomers, useCustomerStats } from '@/hooks/queries/useCustomers'
import { useAdminFilters, FilterConfig } from '@/hooks/use-admin-filters'
import { useExportCustomers } from '@/hooks/mutations/useCustomerMutations'

export default function CustomersPage() {
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'customer_type',
      label: 'Customer Type',
      type: 'enum',
      options: [
        { label: 'Individual', value: 'individual' },
        { label: 'Business', value: 'business' },
      ],
    },
    {
      key: 'status',
      label: 'Status',
      type: 'enum',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
    {
      key: 'created_at',
      label: 'Joined Date',
      type: 'date_range',
    },
  ]

  // Quick filters (shown in main bar)
  const quickFilters = filterConfigs.slice(0, 2) // Customer Type and Status

  // Advanced filters (shown in drawer)
  const advancedFilters = filterConfigs.slice(2) // Joined Date

  // Initialize filters hook
  const {
    filters,
    setFilter,
    removeFilter,
    clearFilters,
    applyFilters,
    activeFilters,
    activeCount,
  } = useAdminFilters({
    configs: filterConfigs,
    defaultFilters: {},
  })

  // React Query hooks - passes filters to backend
  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    error: customersError,
    refetch: refetchCustomers
  } = useCustomers({
    search,
    ...filters,
  } as CustomerFilters, page, 20)

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useCustomerStats()

  const exportMutation = useExportCustomers()

  const handleExport = async () => {
    try {
      const { exportCustomersAction } = await import('@/lib/actions/customers')
      const result = await exportCustomersAction({
        search,
        ...filters,
      } as CustomerFilters)

      if (result.success && result.data) {
        const csv = convertToCSV(result.data)
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        toast.success('Customers exported successfully')
      } else {
        toast.error(result.error || 'Failed to export customers')
      }
    } catch (error) {
      console.error('Error exporting customers:', error)
      toast.error('Failed to export customers')
    }
  }

  // Helper function to convert export data to CSV string
  const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return ''

    const headers = Object.keys(data[0])
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          // Escape commas and quotes in values
          return `"${String(value).replace(/"/g, '""')}"`
        }).join(',')
      ),
    ]

    return csvRows.join('\n')
  }

  const handleRefresh = async () => {
    await Promise.all([refetchCustomers(), refetchStats()])
    toast.success('Data refreshed')
  }

  const hasCustomers = customers.length > 0

  return (
    <div className="space-y-8" data-testid="customers-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Customers
          </h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage customer accounts and view purchase history
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoadingCustomers || isLoadingStats}
          data-testid="refresh-customers-button"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingCustomers || isLoadingStats) ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {isLoadingCustomers ? (
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
          {hasCustomers && <CustomersStats stats={stats} isLoading={isLoadingStats} />}

          {/* Filter Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <FilterBar
                search={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search customers..."
                quickFilters={quickFilters}
                filterValues={filters}
                onFilterChange={setFilter}
                activeFilters={activeFilters}
                onRemoveFilter={removeFilter}
                hasMoreFilters={advancedFilters.length > 0}
                onOpenMoreFilters={() => setDrawerOpen(true)}
                activeFilterCount={activeCount}
                onClearAll={clearFilters}
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="h-10 bg-white border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              data-testid="export-customers-button"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportMutation.isPending ? "Exporting..." : "Export"}
            </Button>
          </div>

          {/* Filter Drawer */}
          <FilterDrawer
            isOpen={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            filters={advancedFilters}
            values={filters}
            onApply={applyFilters}
            onClear={clearFilters}
          />

          {/* Customers Table */}
          {hasCustomers ? (
            <CustomersTable customers={customers} isLoading={isLoadingCustomers} />
          ) : (
            <CustomersEmptyState />
          )}
        </>
      )}
    </div>
  )
}