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
import { Search, Filter, X } from "lucide-react"
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

  const activeFilters = [
    { key: 'search', label: `Search: "${searchQuery}"`, value: searchQuery },
    { key: 'category', label: `Category: ${categories.find(c => c.id === categoryFilter)?.name || categoryFilter}`, value: categoryFilter },
    { key: 'status', label: `Status: ${statusFilter}`, value: statusFilter },
    { key: 'stock', label: `Stock: ${stockFilter}`, value: stockFilter },
  ].filter(filter => filter.value && filter.value !== 'all')

  const removeFilter = (filterKey: string) => {
    switch (filterKey) {
      case 'search':
        onSearchChange('')
        break
      case 'category':
        onCategoryChange('all')
        break
      case 'status':
        onStatusChange('all')
        break
      case 'stock':
        onStockChange('all')
        break
    }
  }

  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            placeholder="Search products..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        
        <Select value={categoryFilter} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-[180px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-sm dark:bg-gray-900/95">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[180px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-sm dark:bg-gray-900/95">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={stockFilter} onValueChange={onStockChange}>
          <SelectTrigger className="w-[180px] border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <SelectValue placeholder="Stock Status" />
          </SelectTrigger>
          <SelectContent className="bg-white/95 backdrop-blur-sm dark:bg-gray-900/95">
            <SelectItem value="all">All Stock</SelectItem>
            <SelectItem value="in-stock">In Stock</SelectItem>
            <SelectItem value="low-stock">Low Stock</SelectItem>
            <SelectItem value="out-of-stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
        
        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>
      
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm text-gray-600 dark:text-gray-400">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge 
              key={filter.key}
              className="flex items-center space-x-1 bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
            >
              <span>{filter.label}</span>
              <X 
                className="h-3 w-3 cursor-pointer hover:text-red-800 dark:hover:text-red-200" 
                onClick={() => removeFilter(filter.key)}
              />
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
            onClick={onClearFilters}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}