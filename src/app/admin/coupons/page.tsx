'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FilterBar } from "@/components/admin/filters"
import { Percent, Users, Calendar, Copy, Edit, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { CreateCouponDialog, ViewCouponDialog, EditCouponDialog } from "@/domains/admin/coupons/create-coupon-dialog"
import { deleteCoupon } from "@/app/actions/coupons"
import { useAdminFilters, FilterConfig } from "@/hooks/use-admin-filters"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"

interface Coupon {
  id: string
  code: string
  discount_type: string
  discount_value: number
  usage_limit: number | null
  usage_count: number | null
  is_active: boolean | null
  expires_at: string | null
  created_at: string
  updated_at: string
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [search, setSearch] = useState("")
  const supabase = createClient()
  const { confirm } = useConfirmDialog()

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'is_active',
      label: 'Status',
      type: 'enum',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
    {
      key: 'discount_type',
      label: 'Type',
      type: 'enum',
      options: [
        { label: 'Percentage', value: 'percentage' },
        { label: 'Fixed Amount', value: 'fixed' },
      ],
    },
  ]

  // Quick filters (shown in main bar)
  const quickFilters = filterConfigs // All filters are quick filters now

  // Advanced filters (shown in drawer)


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

  const fetchCoupons = async () => {
    try {
      setIsLoading(true)

      // Build query with any type to avoid deep instantiation
      let query: any = supabase
        .from('coupons')
        .select('*')

      // Apply search
      if (search) {
        query = query.ilike('code', `%${search}%`)
      }

      // Apply filters
      if (filters.is_active) {
        query = query.eq('is_active', filters.is_active === 'true')
      }

      if (filters.discount_type) {
        query = query.eq('discount_type', filters.discount_type as string)
      }

      if (filters.expires_at && typeof filters.expires_at === 'object') {
        const dateRange = filters.expires_at as { from?: string; to?: string }
        if (dateRange.from) {
          query = query.gte('expires_at', dateRange.from)
        }
        if (dateRange.to) {
          query = query.lte('expires_at', dateRange.to)
        }
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setCoupons((data as unknown as Coupon[]) || [])
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast.error('Failed to load coupons')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [search, filters])

  const activeCoupons = coupons.filter(c => c.is_active)
  const totalUsage = coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0)
  const expiringSoon = coupons.filter(c => {
    if (!c.expires_at) return false
    const expiryDate = new Date(c.expires_at)
    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)
    return expiryDate <= sevenDaysFromNow && expiryDate > new Date()
  }).length

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Coupon code copied!')
  }

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id)

      if (error) throw error
      toast.success(`Coupon ${!coupon.is_active ? 'activated' : 'deactivated'}`)
      fetchCoupons()
    } catch (error) {
      console.error('Error toggling coupon:', error)
      toast.error('Failed to update coupon')
    }
  }

  const handleDelete = async (couponId: string) => {
    const confirmed = await confirm({
      title: "Delete Coupon?",
      description: "Are you sure you want to delete this coupon?",
      confirmText: "Delete",
      variant: "destructive"
    })

    if (!confirmed) return

    try {
      const result = await deleteCoupon(couponId)

      if (!result.success) throw new Error(result.error)

      toast.success('Coupon deleted successfully')
      fetchCoupons()
    } catch (error) {
      console.error('Error deleting coupon:', error)
      toast.error('Failed to delete coupon')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No expiry'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8" data-testid="coupons-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Coupons</h1>
          <p className="text-lg text-gray-600 mt-2">
            Create and manage discount coupons and promotional codes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={fetchCoupons}
            disabled={isLoading}
            data-testid="refresh-coupons-button"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <CreateCouponDialog onSuccess={fetchCoupons} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Active Coupons
            </CardTitle>
            <div className="p-2 rounded-xl bg-green-100">
              <Percent className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2" data-testid="active-coupons-count">{activeCoupons.length}</div>
            <p className="text-xs text-gray-600">Currently running</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Usage
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-100">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2" data-testid="total-usage-count">{totalUsage}</div>
            <p className="text-xs text-gray-600">Times used</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Coupons
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-100">
              <Percent className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2" data-testid="total-coupons-count">{coupons.length}</div>
            <p className="text-xs text-gray-600">All time coupons</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Expiring Soon
            </CardTitle>
            <div className="p-2 rounded-xl bg-orange-100">
              <Calendar className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2" data-testid="expiring-soon-count">{expiringSoon}</div>
            <p className="text-xs text-gray-600">Within 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search coupons..."
        quickFilters={quickFilters}
        filterValues={filters}
        onFilterChange={setFilter}
        activeFilters={activeFilters}
        onRemoveFilter={removeFilter}
        activeFilterCount={activeCount}
        onClearAll={clearFilters}
      />

      {/* Coupons List */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">All Coupons</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-12">
              <Percent className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No coupons yet</h3>
              <p className="text-gray-600 mb-4">Create your first coupon to start offering discounts</p>
              <CreateCouponDialog onSuccess={fetchCoupons} />
            </div>
          ) : (
            <div className="space-y-4">
              {coupons.map((coupon) => (
                <div
                  key={coupon.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-gray-200/50 hover:shadow-md transition-all duration-200"
                  data-testid={`coupon-item-${coupon.code}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <Percent className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <ViewCouponDialog
                          coupon={coupon}
                          onSuccess={fetchCoupons}
                          trigger={
                            <button className="font-bold text-lg text-gray-900 font-mono hover:text-red-600 transition-colors cursor-pointer">
                              {coupon.code}
                            </button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-gray-100"
                          onClick={() => handleCopyCode(coupon.code)}
                          data-testid={`copy-coupon-${coupon.code}`}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {coupon.discount_type === "percentage"
                            ? `${coupon.discount_value}% off`
                            : `₹${coupon.discount_value} off`}
                        </Badge>
                        {coupon.expires_at && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Expires {formatDate(coupon.expires_at)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {coupon.usage_count}/{coupon.usage_limit || '∞'}
                      </p>
                      <p className="text-xs text-gray-500">Used</p>
                    </div>
                    <Badge
                      variant={coupon.is_active ? "default" : "secondary"}
                      className={coupon.is_active
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                      }
                      data-testid={`coupon-status-${coupon.code}`}
                    >
                      {coupon.is_active ? 'active' : 'inactive'}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <EditCouponDialog
                        coupon={coupon}
                        onSuccess={fetchCoupons}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" data-testid={`edit-coupon-${coupon.code}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                        onClick={() => handleToggleActive(coupon)}
                        data-testid={`toggle-coupon-${coupon.code}`}
                      >
                        {coupon.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-100 text-red-600"
                        onClick={() => handleDelete(coupon.id)}
                        data-testid={`delete-coupon-${coupon.code}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
