'use client'

import { useState, useEffect } from 'react'
import { CustomerService } from '@/lib/services/customers'
import { CustomerFilters, CustomerStats } from '@/lib/types/customers'
import { CustomersTable } from '@/domains/admin/customers/customers-table'
import { CustomersFilters } from '@/domains/admin/customers/customers-filters'
import { CustomersStats } from '@/domains/admin/customers/customers-stats'
import { CustomersEmptyState } from '@/components/common/empty-states'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { RefreshCw } from 'lucide-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([])
  const [stats, setStats] = useState<CustomerStats>({
    total: 0,
    active: 0,
    inactive: 0,
    vip: 0,
    newThisMonth: 0,
    totalRevenue: 0,
    averageLifetimeValue: 0,
  })
  const [filters, setFilters] = useState<CustomerFilters>({
    status: 'all',
  })
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch customers
  useEffect(() => {
    fetchCustomers()
  }, [filters, page])

  // Fetch stats on mount
  useEffect(() => {
    fetchStats()
  }, [])

  const fetchCustomers = async () => {
    setIsLoading(true)
    try {
      const result = await CustomerService.getCustomers(filters, page, 20)
      if (result.success && result.data) {
        setCustomers(result.data)
      } else {
        toast.error(result.error || 'Failed to fetch customers')
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to fetch customers')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const result = await CustomerService.getCustomerStats()
      if (result.success && result.data) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
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
        toast.success('Customers exported successfully')
      } else {
        toast.error(result.error || 'Failed to export customers')
      }
    } catch (error) {
      console.error('Error exporting customers:', error)
      toast.error('Failed to export customers')
    } finally {
      setIsExporting(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([fetchCustomers(), fetchStats()])
    setIsRefreshing(false)
    toast.success('Data refreshed')
  }

  const handleFiltersChange = (newFilters: CustomerFilters) => {
    setFilters(newFilters)
    setPage(1)
  }

  const hasCustomers = customers.length > 0 || isLoading

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
          disabled={isRefreshing}
          data-testid="refresh-customers-button"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {hasCustomers ? (
        <>
          {/* Stats Cards */}
          <CustomersStats stats={stats} isLoading={false} />

          {/* Filters */}
          <CustomersFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onExport={handleExport}
            isExporting={isExporting}
          />

          {/* Customers Table */}
          <CustomersTable customers={customers} isLoading={isLoading} />
        </>
      ) : (
        !isLoading && <CustomersEmptyState />
      )}
    </div>
  )
}