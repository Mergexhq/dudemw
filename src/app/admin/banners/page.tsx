"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FilterBar } from "@/components/admin/filters"
import { Plus, Image, Eye, EyeOff, Edit, Trash2, Calendar, RefreshCw } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Banner } from "@/lib/types/banners"
import { useBanners } from "@/hooks/queries/useBanners"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { useAdminFilters, FilterConfig } from "@/hooks/use-admin-filters"

// Helper functions
const getPlacementLabel = (placement: string): string => {
  switch (placement) {
    case "homepage-carousel":
      return "Homepage Carousel"
    case "top-marquee-banner":
      return "Top Marquee Banner"
    default:
      return placement
  }
}

const getStatusColor = (status: string): string => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 border-green-200"
    case "scheduled":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "expired":
      return "bg-gray-100 text-gray-700 border-gray-200"
    case "disabled":
      return "bg-red-100 text-red-700 border-red-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export default function BannersPage() {

  // searchQuery is the live typing state; search is committed on submit
  const [search, setSearch] = useState("")
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearchSubmit = () => setSearch(searchQuery)
  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchSubmit()
  }

  const { confirm } = useConfirmDialog()

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'enum',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Expired', value: 'expired' },
        { label: 'Disabled', value: 'disabled' },
      ],
    },
    {
      key: 'placement',
      label: 'Placement',
      type: 'enum',
      options: [
        { label: 'Homepage Carousel', value: 'homepage-carousel' },
        { label: 'Top Marquee Banner', value: 'top-marquee-banner' },
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

  // React Query hooks - passes filters to backend
  const {
    data: bannersData,
    isLoading,
    refetch: refetchBanners
  } = useBanners({
    search,
    status: filters.status,
    placement: filters.placement,
  })

  const banners = bannersData?.banners || []
  const stats = bannersData?.stats

  const handleRefresh = async () => {
    await refetchBanners()
    toast.success('Banners refreshed')
  }

  const handleToggleStatus = async (bannerId: string) => {
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}/toggle`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to toggle banner status')

      toast.success('Banner status updated')
      refetchBanners()
    } catch (error) {
      console.error('Error toggling banner status:', error)
      toast.error('Failed to update banner status')
    }
  }

  const handleDeleteBanner = async (bannerId: string) => {
    const confirmed = await confirm({
      title: "Delete Banner?",
      description: "Are you sure you want to delete this banner?",
      confirmText: "Delete",
      variant: "destructive"
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete banner')

      toast.success('Banner deleted successfully')
      refetchBanners()
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error('Failed to delete banner')
    }
  }

  // Calculate display stats
  const activeBanners = stats?.active || 0
  const totalBanners = stats?.total || 0
  const scheduledBanners = stats?.scheduled || 0

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
              Banners
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 mt-1 sm:mt-2">
              What banners are live right now, and where?
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              data-testid="refresh-banners-button"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button asChild className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 flex-shrink-0">
              <Link href="/admin/banners/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Banner
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Active Banners
              </CardTitle>
              <div className="p-2 rounded-xl bg-green-100">
                <Eye className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{activeBanners}</div>
              <p className="text-xs text-gray-600">Currently running</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Total Banners
              </CardTitle>
              <div className="p-2 rounded-xl bg-blue-100">
                <Image className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{totalBanners.toLocaleString()}</div>
              <p className="text-xs text-gray-600">All banners</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200 sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Scheduled
              </CardTitle>
              <div className="p-2 rounded-xl bg-purple-100">
                <Calendar className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{scheduledBanners}</div>
              <p className="text-xs text-gray-600">Upcoming banners</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar */}
        <FilterBar
          search={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onSearchKeyDown={handleSearchKeyDown}
          searchPlaceholder="Search banners..."
          quickFilters={quickFilters}
          filterValues={filters}
          onFilterChange={setFilter}
          activeFilters={activeFilters}
          onRemoveFilter={removeFilter}
          activeFilterCount={activeCount}
          onClearAll={clearFilters}
        />

        {/* Banners Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : banners.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Image className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No banners found</h3>
              <p className="text-sm text-gray-600 mb-6">Get started by creating your first banner</p>
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                <Link href="/admin/banners/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Banner
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {banners.map((banner: Banner) => (
              <Card key={banner.id} className="overflow-hidden hover:shadow-lg transition-all duration-200">
                <div className="aspect-video relative bg-gray-100">
                  {banner.image_url ? (
                    <img
                      src={banner.image_url}
                      alt={banner.internal_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Image className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Badge className={getStatusColor(banner.status)}>
                      {banner.status}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 truncate">{banner.internal_title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{getPlacementLabel(banner.placement)}</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(banner.id)}
                      className="flex-1"
                    >
                      {banner.status === 'active' ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Disable
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Enable
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <Link href={`/admin/banners/${banner.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
