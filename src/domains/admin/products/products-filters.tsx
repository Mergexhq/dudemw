"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X } from "lucide-react"
import { getCategories } from "@/lib/actions/products"

interface ProductsFiltersProps {
  searchQuery: string
  categoryFilter: string
  statusFilter: string
  stockFilter: string
  onSearchChange: (value: string) => void
  onCategoryChange: (value: string) => void
  onStatusChange: (value: string) => void
  onStockChange: (value: string) => void
  onClearFilters: () => void
}

interface Category {
  id: string
  name: string
  slug: string
}

export function ProductsFilters({
  searchQuery,
  categoryFilter,
  statusFilter,
  stockFilter,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onStockChange,
  onClearFilters,
}: ProductsFiltersProps) {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const fetchCategories = async () => {
      const result = await getCategories()
      if (result.success && result.data) {
        setCategories(result.data)
      }
    }
    fetchCategories()
  }, [])

  // Check if any filter is active
  const hasActiveFilters = searchQuery ||
    categoryFilter !== 'all' ||
    statusFilter !== 'all' ||
    stockFilter !== 'all'

  // Count active filters
  const activeFilterCount = [
    searchQuery,
    categoryFilter !== 'all' ? categoryFilter : null,
    statusFilter !== 'all' ? statusFilter : null,
    stockFilter !== 'all' ? stockFilter : null,
  ].filter(Boolean).length

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search products..."
          className="pl-9 h-9 bg-white border-gray-200 focus:border-red-300 focus:ring-red-200"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status Filter - Most Important */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[120px] h-9 bg-white border-gray-200">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>

      {/* Stock Filter - Second Important */}
      <Select value={stockFilter} onValueChange={onStockChange}>
        <SelectTrigger className="w-[130px] h-9 bg-white border-gray-200">
          <SelectValue placeholder="Stock" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stock</SelectItem>
          <SelectItem value="in-stock">In Stock</SelectItem>
          <SelectItem value="low-stock">Low Stock</SelectItem>
          <SelectItem value="out-of-stock">Out of Stock</SelectItem>
        </SelectContent>
      </Select>

      {/* Category Filter - Optional */}
      {categories.length > 0 && (
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[140px] h-9 bg-white border-gray-200">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Clear Filters Button - Only shows when filters are active */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="h-9 text-gray-500 hover:text-red-600 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Clear {activeFilterCount > 1 ? `(${activeFilterCount})` : ''}
        </Button>
      )}
    </div>
  )
}