'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useConfirmDialog } from "@/hooks/use-confirm-dialog"
import { FilterBar } from "@/components/admin/filters"
import { Plus, FolderTree, Package, Eye, Edit, Trash2, ChevronRight, Loader2, RefreshCw } from "lucide-react"
import { toast } from 'sonner'
import Link from 'next/link'
import { useCategories, useCategoryStats } from '@/hooks/queries/useCategories'
import { CategoryWithChildren } from '@/lib/services/categories'
import { deleteCategoryAction } from '@/lib/actions/categories'
import { useAdminFilters, FilterConfig } from '@/hooks/use-admin-filters'

export default function CategoriesPage() {
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
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ]

  // Initialize filters hook
  const {
    filters,
    setFilter,
    removeFilter,
    clearFilters,
    activeFilters,
    activeCount,
  } = useAdminFilters({
    configs: filterConfigs,
    defaultFilters: {},
  })

  // React Query hooks - passes filters to backend
  const {
    data: categories = [],
    isLoading,
    refetch: refetchCategories
  } = useCategories({
    search,
    ...filters,
  })

  const {
    data: stats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useCategoryStats()

  const handleRefresh = async () => {
    await Promise.all([refetchCategories(), refetchStats()])
    toast.success('Categories refreshed')
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete Category',
      description: 'Are you sure you want to delete this category? This action cannot be undone.',
      variant: 'destructive',
      confirmText: 'Delete'
    })

    if (!confirmed) return

    try {
      const result = await deleteCategoryAction(id)
      if (result.success) {
        toast.success('Category deleted successfully')
        refetchCategories()
        refetchStats()
      } else {
        toast.error(result.error || 'Failed to delete category')
      }
    } catch (error) {
      toast.error('Failed to delete category')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8" data-testid="categories-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Categories</h1>
          <p className="text-lg text-gray-600 mt-2">
            Organize your products with categories and subcategories
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading || isLoadingStats}
            data-testid="refresh-categories-button"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${(isLoading || isLoadingStats) ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Link href="/admin/categories/create">
            <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25">
              <Plus className="mr-2 h-4 w-4" />
              Create Category
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Categories
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-100">
              <FolderTree className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats?.total || 0}</div>
            <p className="text-xs text-gray-600">Main categories</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Products
            </CardTitle>
            <div className="p-2 rounded-xl bg-green-100">
              <Package className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats?.total_products || 0}</div>
            <p className="text-xs text-gray-600">Across all categories</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Active Categories
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-100">
              <Eye className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats?.active || 0}</div>
            <p className="text-xs text-gray-600">Currently visible</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <FilterBar
        search={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onSearchKeyDown={handleSearchKeyDown}
        searchPlaceholder="Search categories..."
        quickFilters={filterConfigs}
        filterValues={filters}
        onFilterChange={setFilter}
        activeFilters={activeFilters}
        onRemoveFilter={removeFilter}
        activeFilterCount={activeCount}
        onClearAll={clearFilters}
      />

      {/* Categories List */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderTree className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No categories yet</h3>
              <p className="mt-2 text-sm text-gray-500">Get started by creating your first category</p>
              <Link href="/admin/categories/create">
                <Button className="mt-4 bg-red-600 hover:bg-red-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Category
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category: CategoryWithChildren) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center space-x-4">
                      {category.image_url ? (
                        <img src={category.image_url} alt={category.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FolderTree className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <Link href={`/admin/categories/${category.id}`} className="font-semibold text-gray-900 hover:text-red-600 transition-colors">
                          {category.name}
                        </Link>
                        <p className="text-xs text-gray-500">/{category.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-900">{category.product_count || 0}</p>
                        <p className="text-xs text-gray-500">Products</p>
                      </div>

                      <Badge
                        variant={category.status === "active" ? "default" : "secondary"}
                        className={category.status === "active"
                          ? "bg-green-100 text-green-700 border-green-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                        }
                      >
                        {category.status}
                      </Badge>

                      <div className="flex items-center space-x-2">
                        <Link href={`/admin/categories/${category.id}/edit`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-100 text-red-600"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
