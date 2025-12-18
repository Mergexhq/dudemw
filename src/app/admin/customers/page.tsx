'use client'

import { useState } from 'react'
import { CustomerService } from '@/lib/services/customers'
import { CustomerFilters } from '@/lib/types/customers'
import { CustomersTable } from '@/domains/admin/customers/customers-table'
import { CustomersFilters } from '@/domains/admin/customers/customers-filters'
import { CustomersStats } from '@/domains/admin/customers/customers-stats'
import { CustomersEmptyState } from '@/components/common/empty-states'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'
import { useCustomers, useCustomerStats } from '@/hooks/queries/useCustomers'
import { useExportCustomers } from '@/hooks/mutations/useCustomerMutations'

export default function CustomersPage() {
  const [filters, setFilters] = useState<CustomerFilters>({
    status: 'all',
  })
  const [page, setPage] = useState(1)

  // React Query hooks
  const { 
    data: customers = [], 
    isLoading: isLoadingCustomers,
    refetch: refetchCustomers 
  } = useCustomers(filters, page, 20)
  
  const { 
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats 
  } = useCustomerStats()

  const exportMutation = useExportCustomers()

  const handleExport = async () => {
    try {
      const result = await CustomerService.exportCustomers(filters)
      if (result.success && result.data) {
        const csv = CustomerService.convertToCSV(result.data)
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Error exporting customers:', error)
    }
  }

  const handleRefresh = async () => {
    await Promise.all([refetchCustomers(), refetchStats()])
    toast.success('Data refreshed')
  }

  const handleFiltersChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const hasCustomers = customers.length > 0 || isLoadingCustomers

  return (
    <div className="space-y-8" data-testid="customers-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Customers
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
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

      {hasCustomers ? (
        <>
          {/* Stats Cards */}
          <CustomersStats stats={stats} isLoading={isLoadingStats} />

          {/* Filters */}
          <CustomersFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onExport={handleExport}
            isExporting={exportMutation.isPending}
          />

          {/* Customers Table */}
          <CustomersTable customers={customers} isLoading={isLoadingCustomers} />
        </>
      ) : (
        !isLoadingCustomers && <CustomersEmptyState />
      )}
    </div>
  )
}