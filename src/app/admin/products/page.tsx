"use client"

import { useState, useMemo } from "react"
import { ProductsTable } from "@/domains/admin/products/products-table"
import { ProductsEmptyState } from "@/components/common/empty-states"
import { AdminFilters, FilterConfig, ActiveFilterChip } from "@/components/admin/filters/AdminFilters"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Download, RefreshCw, Package, CheckCircle, FileText } from "lucide-react"
import Link from "next/link"
import { useProducts } from "@/hooks/queries/useProducts"
import { useAdminFilters } from "@/hooks/useAdminFilters"
import { getActiveFiltersWithLabels } from "@/lib/utils/filter-utils"
import { toast } from "sonner"
import { getCategories } from "@/lib/actions/products"
import { useEffect } from "react"

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

const DEFAULT_FILTERS = {
  search: "",
  category: "all",
  status: "all",
  stock: "all",
}

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>([])

  // Filter management with URL params
  const {
    filters,
    setFilter,
    clearFilters,
  } = useAdminFilters({
    defaultFilters: DEFAULT_FILTERS,
  })

  // React Query hook
  const {
    data: products = [],
    isLoading,
    refetch: refetchProducts
  } = useProducts()

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

  const handleRefresh = async () => {
    await refetchProducts()
    toast.success('Products refreshed')
  }

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      // Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase()
        const matchesTitle = product.title.toLowerCase().includes(query)
        const matchesSlug = product.slug.toLowerCase().includes(query)
        const matchesDescription = product.description?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesSlug && !matchesDescription) {
          return false
        }
      }

      // Category filter
      if (filters.category !== 'all') {
        const hasCategory = product.product_categories?.some(
          pc => pc.categories.id === filters.category
        )
        if (!hasCategory) return false
      }

      // Status filter
      if (filters.status !== 'all') {
        if (product.status !== filters.status) return false
      }

      // Stock filter
      if (filters.stock !== 'all') {
        const totalStock = product.global_stock ||
          product.product_variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0

        switch (filters.stock) {
          case 'in-stock':
            if (totalStock <= 0) return false
            break
          case 'low-stock':
            if (totalStock === 0 || totalStock >= 10) return false
            break
          case 'out-of-stock':
            if (totalStock > 0) return false
            break
        }
      }

      return true
    })
  }, [products, filters])

  // Filter configuration
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      key: "status",
      label: "Status",
      placeholder: "All Status",
      options: [
        { value: "all", label: "All Status" },
        { value: "published", label: "Published" },
        { value: "draft", label: "Draft" },
      ],
      icon: CheckCircle,
      width: "w-[140px]",
    },
    {
      key: "stock",
      label: "Stock",
      placeholder: "All Stock",
      options: [
        { value: "all", label: "All Stock" },
        { value: "in-stock", label: "In Stock" },
        { value: "low-stock", label: "Low Stock" },
        { value: "out-of-stock", label: "Out of Stock" },
      ],
      icon: Package,
      width: "w-[160px]",
    },
    {
      key: "category",
      label: "Category",
      placeholder: "All Categories",
      options: [
        { value: "all", label: "All Categories" },
        ...categories.map(cat => ({
          value: cat.id,
          label: cat.name,
        })),
      ],
      icon: FileText,
      width: "w-[180px]",
    },
  ], [categories])

  // Active filter chips
  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    return getActiveFiltersWithLabels(filters, DEFAULT_FILTERS).map(filter => {
      let label = filter.label

      // Custom label for category
      if (filter.key === 'category') {
        const category = categories.find(c => c.id === filter.value)
        if (category) {
          label = `Category: ${category.name}`
        }
      }

      return {
        key: filter.key,
        label,
        value: filter.value,
      }
    })
  }, [filters, categories])

  const handleExport = () => {
    if (!filteredProducts.length) {
      toast.error("No products to export")
      return
    }

    const headers = [
      "ID", "Title", "Slug", "Status", "Price", "Compare Price",
      "Stock", "Category", "Variants Count"
    ]

    const csvContent = [
      headers.join(","),
      ...filteredProducts.map((product: Product) => {
        const categoryName = product.product_categories?.[0]?.categories?.name || 'Uncategorized'
        const totalStock = product.global_stock ||
          product.product_variants?.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0) || 0

        return [
          product.id,
          `"${product.title.replace(/"/g, '""')}"`, // Escape quotes
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
    toast.success(`Exported ${filteredProducts.length} products`)
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
  const hasFilteredProducts = filteredProducts.length > 0

  return (
    <div className="space-y-8" data-testid="products-page">
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
          <AdminFilters
            searchValue={filters.search}
            onSearchChange={(value) => setFilter("search", value)}
            searchPlaceholder="Search products..."
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={setFilter}
            onClearAll={clearFilters}
            activeFilters={activeFilterChips}
            totalCount={filteredProducts.length}
            isLoading={isLoading}
            showActiveChips={true}
          />

          {hasFilteredProducts ? (
            <ProductsTable
              products={filteredProducts}
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
        <>
          <AdminFilters
            searchValue={filters.search}
            onSearchChange={(value) => setFilter("search", value)}
            searchPlaceholder="Search products..."
            filters={filterConfigs}
            filterValues={filters}
            onFilterChange={setFilter}
            onClearAll={clearFilters}
            activeFilters={activeFilterChips}
            totalCount={0}
            isLoading={isLoading}
            showActiveChips={true}
          />
          <ProductsEmptyState />
        </>
      )}
    </div>
  )
}
