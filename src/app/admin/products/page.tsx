"use client"

import { useState, useMemo } from "react"
import { ProductsTable } from "@/domains/admin/products/products-table"
import { ProductsFilters } from "@/domains/admin/products/products-filters"
import { ProductsEmptyState } from "@/components/common/empty-states"
import { Button } from "@/components/ui/button"
import { Plus, Upload, Download, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useProducts } from "@/hooks/queries/useProducts"
import { toast } from "sonner"

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

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')

  // React Query hook
  const {
    data: products = [],
    isLoading,
    refetch: refetchProducts
  } = useProducts()

  const handleRefresh = async () => {
    await refetchProducts()
    toast.success('Products refreshed')
  }

  const filteredProducts = useMemo(() => {
    return products.filter((product: Product) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = product.title.toLowerCase().includes(query)
        const matchesSlug = product.slug.toLowerCase().includes(query)
        const matchesDescription = product.description?.toLowerCase().includes(query)
        if (!matchesTitle && !matchesSlug && !matchesDescription) {
          return false
        }
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const hasCategory = product.product_categories?.some(
          pc => pc.categories.id === categoryFilter
        )
        if (!hasCategory) return false
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (product.status !== statusFilter) return false
      }

      // Stock filter
      if (stockFilter !== 'all') {
        const totalStock = product.global_stock ||
          product.product_variants?.reduce((sum, variant) => sum + (variant.stock || 0), 0) || 0

        switch (stockFilter) {
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
  }, [products, searchQuery, categoryFilter, statusFilter, stockFilter])

  const handleClearFilters = () => {
    setSearchQuery('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setStockFilter('all')
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
              onClick={() => {
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
              }}
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
          <ProductsFilters
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            stockFilter={stockFilter}
            onSearchChange={setSearchQuery}
            onCategoryChange={setCategoryFilter}
            onStatusChange={setStatusFilter}
            onStockChange={setStockFilter}
            onClearFilters={handleClearFilters}
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
                onClick={handleClearFilters}
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
