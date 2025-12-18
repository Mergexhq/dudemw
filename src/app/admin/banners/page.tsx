"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Image, Eye, EyeOff, Edit, Trash2, Upload, Search, Filter, Calendar, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { Banner, BannerStats } from "@/lib/types/banners"

// Helper functions
const getPlacementLabel = (placement: string): string => {
  switch (placement) {
    case "homepage-carousel":
      return "Homepage Carousel"
    case "product-listing-carousel":
      return "Product Listing Carousel"
    case "category-banner":
      return "Category Banner"
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
  const [banners, setBanners] = useState<Banner[]>([])
  const [stats, setStats] = useState<BannerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [placementFilter, setPlacementFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Fetch banners
  const fetchBanners = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (searchQuery) params.append('search', searchQuery)
      if (placementFilter !== 'all') params.append('placement', placementFilter)
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)

      const response = await fetch(`/api/admin/banners?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch banners')
      
      const data = await response.json()
      setBanners(data)
    } catch (error) {
      console.error('Error fetching banners:', error)
      toast.error('Failed to load banners')
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/banners/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Load data on mount and filter changes
  useEffect(() => {
    fetchBanners()
  }, [searchQuery, placementFilter, statusFilter, categoryFilter])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleToggleStatus = async (bannerId: string) => {
    try {
      const response = await fetch(`/api/admin/banners/${bannerId}/toggle`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to toggle banner status')

      toast.success('Banner status updated')
      fetchBanners()
      fetchStats()
    } catch (error) {
      console.error('Error toggling banner status:', error)
      toast.error('Failed to update banner status')
    }
  }

  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return

    try {
      const response = await fetch(`/api/admin/banners/${bannerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete banner')

      toast.success('Banner deleted successfully')
      fetchBanners()
      fetchStats()
    } catch (error) {
      console.error('Error deleting banner:', error)
      toast.error('Failed to delete banner')
    }
  }

  // Calculate display stats
  const activeBanners = stats?.active || 0
  const totalClicks = stats?.totalClicks || 0
  const avgCTR = stats?.averageCTR?.toFixed(1) || "0"

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
          <Button asChild className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25 flex-shrink-0">
            <Link href="/admin/banners/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Banner
            </Link>
          </Button>
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
                Total Clicks
              </CardTitle>
              <div className="p-2 rounded-xl bg-blue-100">
                <Image className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{totalClicks.toLocaleString()}</div>
              <p className="text-xs text-gray-600">This month</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200 sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">
                Avg. CTR
              </CardTitle>
              <div className="p-2 rounded-xl bg-purple-100">
                <Upload className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">{avgCTR}%</div>
              <p className="text-xs text-gray-600">Click-through rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg font-bold text-gray-900">
              <Filter className="h-5 w-5" />
              <span>Filters</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
              <div className="space-y-2 min-w-0">
                <label className="text-sm font-medium text-gray-700">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search banners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
              </div>

              <div className="space-y-2 min-w-0">
                <label className="text-sm font-medium text-gray-700">Placement</label>
                <Select value={placementFilter} onValueChange={setPlacementFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Placements</SelectItem>
                    <SelectItem value="homepage-carousel">Homepage Carousel</SelectItem>
                    <SelectItem value="product-listing-carousel">Product Listing Carousel</SelectItem>
                    <SelectItem value="category-banner">Category Banner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-0">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 min-w-0">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Shirts">Shirts</SelectItem>
                    <SelectItem value="Hoodies">Hoodies</SelectItem>
                    <SelectItem value="Pants">Pants</SelectItem>
                    <SelectItem value="Jackets">Jackets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banner List */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900">
              All Banners ({filteredBanners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredBanners.length === 0 ? (
              <div className="text-center py-12">
                <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No banners found</h3>
                <p className="text-gray-600 mb-6">
                  {searchQuery || placementFilter !== "all" || statusFilter !== "all" || categoryFilter !== "all"
                    ? "Try adjusting your filters to see more results."
                    : "Get started by creating your first banner."}
                </p>
                <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                  <Link href="/admin/banners/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Banner
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBanners.map((banner) => (
                  <div
                    key={banner.id}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 rounded-xl bg-white/60 border border-gray-200/50 hover:shadow-md transition-all duration-200 gap-4"
                  >
                    {/* Banner Info */}
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Image className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-gray-900 truncate">{banner.internalTitle}</h3>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-sm text-gray-600">{getPlacementLabel(banner.placement)}</span>
                          {banner.category && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">{banner.category}</span>
                            </>
                          )}
                          {banner.position && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-sm text-gray-600">Position {banner.position}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-sm text-gray-500">→ {banner.target.name}</span>
                          {banner.ctaText && (
                            <Badge variant="outline" className="text-xs">
                              {banner.ctaText}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Schedule Info */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {banner.schedule.startDate && new Date(banner.schedule.startDate).toLocaleDateString()}
                          {banner.schedule.endDate && ` → ${new Date(banner.schedule.endDate).toLocaleDateString()}`}
                        </span>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center justify-between lg:justify-end space-x-6">
                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{banner.clicks.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">Clicks</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900">{banner.ctr}</p>
                          <p className="text-xs text-gray-500">CTR</p>
                        </div>
                        <Badge variant="outline" className={getStatusColor(banner.status)}>
                          {banner.status}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" asChild>
                          <Link href={`/admin/banners/${banner.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-gray-100"
                          onClick={() => handleToggleStatus(banner.id)}
                        >
                          {banner.status === "active" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-100 text-red-600"
                          onClick={() => handleDeleteBanner(banner.id)}
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
    </div>
  )
}