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
import { Badge } from "@/components/ui/badge"
import { Search, X, Filter, RefreshCw } from "lucide-react"
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

  // Get active filter labels for chips
  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || id
  }

  const getStockLabel = (value: string) => {
    switch (value) {
      case 'in-stock': return 'In Stock'
      case 'low-stock': return 'Low Stock'
      case 'out-of-stock': return 'Out of Stock'
      default: return value
    }
  }

  const getStatusLabel = (value: string) => {
    return value.charAt(0).toUpperCase() + value.slice(1)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-[400px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search products..."
            className="pl-9 h-10 bg-white border-gray-200 focus:border-red-300 focus:ring-red-200"
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

        {/* Status Filter */}
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[160px] h-10 bg-white border-gray-200 font-medium">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="min-w-[160px]">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>

        {/* Stock Filter */}
        <Select value={stockFilter} onValueChange={onStockChange}>
          <SelectTrigger className="w-[180px] h-10 bg-white border-gray-200 font-medium">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent className="min-w-[180px]">
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[200px] h-10 bg-white border-gray-200 font-medium">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="min-w-[200px]">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="h-10 text-gray-500 hover:text-red-600 hover:bg-red-50 px-3"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        )}
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md mr-1">
            <Filter className="h-3 w-3 mr-1" />
            Active Filters:
          </div>

          {searchQuery && (
            <Badge variant="secondary" className="pl-2 pr-1 py-0.5 bg-red-50 text-red-700 border-red-100 flex items-center gap-1 group truncate max-w-[200px]">
              <span className="truncate">Search: {searchQuery}</span>
              <button
                onClick={() => onSearchChange('')}
                className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="pl-2 pr-1 py-0.5 bg-red-50 text-red-700 border-red-100 flex items-center gap-1 group">
              <span>Status: {getStatusLabel(statusFilter)}</span>
              <button
                onClick={() => onStatusChange('all')}
                className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {stockFilter !== 'all' && (
            <Badge variant="secondary" className="pl-2 pr-1 py-0.5 bg-red-50 text-red-700 border-red-100 flex items-center gap-1 group">
              <span>Stock: {getStockLabel(stockFilter)}</span>
              <button
                onClick={() => onStockChange('all')}
                className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {categoryFilter !== 'all' && (
            <Badge variant="secondary" className="pl-2 pr-1 py-0.5 bg-red-50 text-red-700 border-red-100 flex items-center gap-1 group truncate max-w-[200px]">
              <span className="truncate">Category: {getCategoryName(categoryFilter)}</span>
              <button
                onClick={() => onCategoryChange('all')}
                className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-[10px] h-6 px-2 text-gray-400 hover:text-red-600 uppercase tracking-wider font-bold"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}