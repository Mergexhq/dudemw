'use client'

import { useState, useMemo } from 'react'
import { CustomerFilters } from '@/lib/types/customers'
import { CustomersTable } from '@/domains/admin/customers/customers-table'
import { CustomersStats } from '@/domains/admin/customers/customers-stats'
import { CustomersEmptyState } from '@/components/common/empty-states'
import { AdminFilters, FilterConfig, ActiveFilterChip } from '@/components/admin/filters/AdminFilters'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw, Download, Users, UserCheck } from 'lucide-react'
import { useCustomers, useCustomerStats } from '@/hooks/queries/useCustomers'
import { useAdminFilters } from '@/hooks/useAdminFilters'
import { getActiveFiltersWithLabels } from '@/lib/utils/filter-utils'
import { useExportCustomers } from '@/hooks/mutations/useCustomerMutations'

const DEFAULT_FILTERS = {
  search: "",
  status: "all",
  customerType: "all",
}

export default function CustomersPage() {
  const [page, setPage] = useState(1)

  // Filter management with URL params
  const {
    filters,
    setFilter,
    clearFilters,
  } = useAdminFilters({
    defaultFilters: DEFAULT_FILTERS,
    onFilterChange: () => setPage(1),
  })

  // React Query hooks
  const {
    data: customers = [],
    isLoading: isLoadingCustomers,
    error: customersError,
    refetch: refetchCustomers
  } = useCustomers(filters as CustomerFilters, page, 20)

  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
    refetch: refetchStats
  } = useCustomerStats()

  const exportMutation = useExportCustomers()

  // Filter configuration
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: "status",
      label: "Status",
      placeholder: "All Status",
      options: [
        { value: "all", label: "All Status" },
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
      icon: UserCheck,
      width: "w-[130px]",
    },
    {
      key: "customerType",
      label: "Type",
      placeholder: "All Types",
      options: [
        { value: "all", label: "All Types" },
        { value: "registered", label: "Registered" },
        { value: "guest", label: "Guests" },
      ],
      icon: Users,
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
      const { exportCustomersAction } = await import('@/lib/actions/customers')
      const result = await exportCustomersAction(filters as CustomerFilters)
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

          {/* Filters */}
          <AdminFilters
            searchValue={filters.search}
            onSearchChange={(value) => setFilter("search", value)}
            searchPlaceholder="Search customers..."
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={setFilter}
            onClearAll={clearFilters}
            activeFilters={activeFilterChips}
            isLoading={isLoadingCustomers}
            showActiveChips={true}
            rightActions={
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
            }
          />

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