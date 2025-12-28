'use client'

import { useState } from 'react'
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
    error: customersError,
    refetch: refetchCustomers 
  } = useCustomers(filters, page, 20)
  
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
      const result = await exportCustomersAction(filters)
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

  const handleFiltersChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters)
    setPage(1)
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
      ) : hasCustomers ? (
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
        <CustomersEmptyState />
      )}
    </div>
  )
}