"use client"

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
import { InventoryFilters as InventoryFiltersType } from "@/lib/types/inventory"

interface InventoryFiltersProps {
  filters: InventoryFiltersType
  onFiltersChange: (filters: InventoryFiltersType) => void
}

export function InventoryFilters({ filters, onFiltersChange }: InventoryFiltersProps) {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search })
  }

  const handleStockStatusChange = (stockStatus: "all" | "in_stock" | "low_stock" | "out_of_stock") => {
    onFiltersChange({ ...filters, stockStatus })
  }

  const clearFilters = () => {
    onFiltersChange({ stockStatus: "all" })
  }

  const hasActiveFilters = filters.search || filters.stockStatus !== "all"

  // Count active filters
  const activeFilterCount = [
    filters.search,
    filters.stockStatus !== "all" ? filters.stockStatus : null,
  ].filter(Boolean).length

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search inventory..."
          value={filters.search || ""}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 h-9 bg-white border-gray-200 focus:border-red-300 focus:ring-red-200"
        />
        {filters.search && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Stock Status Filter */}
      <Select value={filters.stockStatus || "all"} onValueChange={(value) => handleStockStatusChange(value as "all" | "in_stock" | "low_stock" | "out_of_stock")}>
        <SelectTrigger className="w-[130px] h-9 bg-white border-gray-200">
          <SelectValue placeholder="Stock" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stock</SelectItem>
          <SelectItem value="in_stock">In Stock</SelectItem>
          <SelectItem value="low_stock">Low Stock</SelectItem>
          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-9 text-gray-500 hover:text-red-600 hover:bg-red-50"
        >
          <X className="h-4 w-4 mr-1" />
          Clear {activeFilterCount > 1 ? `(${activeFilterCount})` : ""}
        </Button>
      )}
    </div>
  )
}