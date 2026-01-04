"use client"

import { useState, useEffect } from "react"
import { ProductsTable } from "@/domains/admin/products/products-table"
import { ProductsEmptyState } from "@/components/common/empty-states"
import { FilterBar } from "@/components/admin/filters"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useProducts } from "@/hooks/queries/useProducts"
import { useAdminFilters, FilterConfig } from "@/hooks/use-admin-filters"
import { toast } from "sonner"
import { getCategories } from "@/lib/actions/products"

interface Product {
  id: string
  title: string
  slug: string
  description: string | null
  category_id: string | null
  status: string | null
  price: number
  compare_price: number | null
  global_stock: number | null
  product_images: Array<{
    id: string
    image_url: string
    alt_text: string | null
    is_primary: boolean | null
  }>
  product_variants: Array<{
    id: string
    name: string | null
    sku: string
    price: number
    stock: number
    active: boolean | null
  }>
  product_categories: Array<{
    categories: {
      id: string
      name: string
      slug: string
    }
  }>
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([])

  const [search, setSearch] = useState("")

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      const result = await getCategories()
      if (result.success && result.data) {
        setCategories(result.data)
      }
    }
    fetchCategories()
  }, [])

  // Filter configuration
  const filterConfigs: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'enum',
      options: [
        { label: 'Published', value: 'published' },
        { label: 'Draft', value: 'draft' },
        { label: 'Archived', value: 'archived' },
      ],
    },
    {
      key: 'category',
      label: 'Category',
      type: 'enum',
      options: categories.map(cat => ({
        value: cat.id,
        label: cat.name,
      })),
    },
    {
      key: 'stock_status',
      label: 'Stock Status',
      type: 'enum',
      options: [
        { label: 'In Stock', value: 'in_stock' },
        { label: 'Low Stock', value: 'low_stock' },
        { label: 'Out of Stock', value: 'out_of_stock' },
      ],
    },
    {
      key: 'price',
      label: 'Price Range',
      type: 'number_range',
      placeholder: { min: 'Min price', max: 'Max price' },
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

  // React Query hook - passes filters to backend
  const {
    data: products = [],
    isLoading,
    refetch: refetchProducts
  } = useProducts({
    search,
    ...filters,
  })

  const handleRefresh = async () => {
    await refetchProducts()
    toast.success('Products refreshed')
  }

  const handleExport = () => {
    if (!products.length) {
      toast.error("No products to export")
      return
    }

    const headers = [
      "ID", "Title", "Slug", "Status", "Price", "Compare Price",
      "Stock", "Category", "Variants Count"
    ]

    const csvContent = [
      headers.join(","),
      ...products.map((product: Product) => {
        const categoryName = product.product_categories?.[0]?.categories?.name || 'Uncategorized'
        const totalStock = product.global_stock ||
          product.product_variants?.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0) || 0

        return [
          product.id,
          `"${product.title.replace(/"/g, '""')}"`,
          product.slug,
          product.status || "draft",
          product.price,
          product.compare_price || "",
          totalStock,
          `"${categoryName.replace(/"/g, '""')}"`,
          product.product_variants?.length || 0
        ].join(",")
      })
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `products_export_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success(`Exported ${products.length} products`)
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">Products</h1>
            <p className="text-lg text-gray-600 mt-2">
              Manage your product catalog and inventory
            </p>
          </div>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">Loading products...</p>
        </div>
      </div>
    )
  }

  const hasProducts = products.length > 0

  return (
    <div className="space-y-8" data-testid="products-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Products</h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage your product catalog and inventory
          </p>
        </div>
        {hasProducts ? (
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isLoading}
              data-testid="refresh-products-button"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300" asChild>
              <Link href="/admin/products/import">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Link>
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25" asChild>
              <Link href="/admin/products/create">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300" asChild>
              <Link href="/admin/products/import">
                <Upload className="mr-2 h-4 w-4" />
                Bulk Import
              </Link>
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25" asChild>
              <Link href="/admin/products/create">
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
            </Button>
          </div>
        )}
      </div>

      {hasProducts ? (
        <>
          {/* Filter Bar */}
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search products..."
            quickFilters={quickFilters}
            filterValues={filters}
            onFilterChange={setFilter}
            activeFilters={activeFilters}
            onRemoveFilter={removeFilter}
            activeFilterCount={activeCount}
            onClearAll={clearFilters}
          />

          {/* Products Table */}
          {products.length > 0 ? (
            <ProductsTable
              products={products}
              onRefresh={refetchProducts}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No products match your current filters.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </>
      ) : (
        <ProductsEmptyState />
      )}
    </div>
  )
}
