"use client"

import { useState } from "react"
import { CustomerFilters } from "@/lib/types/customers"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, X, Download } from "lucide-react"

interface CustomersFiltersProps {
  filters: CustomerFilters
  onFiltersChange: (filters: CustomerFilters) => void
  onExport: () => void
  isExporting?: boolean
}

export function CustomersFilters({
  filters,
  onFiltersChange,
  onExport,
  isExporting,
}: CustomersFiltersProps) {
  const [localSearch, setLocalSearch] = useState(filters.search || "")

  const handleSearchChange = (value: string) => {
    setLocalSearch(value)
    onFiltersChange({ ...filters, search: value })
  }

  const handleClearFilters = () => {
    setLocalSearch("")
    onFiltersChange({ status: "all" })
  }

  const hasActiveFilters = filters.search || filters.status !== "all"

  // Count active filters
  const activeFilterCount = [
    filters.search,
    filters.status !== "all" ? filters.status : null,
  ].filter(Boolean).length

  return (
    <div className="flex items-center gap-3 flex-wrap" data-testid="customers-filters">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search customers..."
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 h-9 bg-white border-gray-200 focus:border-red-300 focus:ring-red-200"
          data-testid="customer-search-input"
        />
        {localSearch && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Status Filter */}
      <Select
        value={filters.status || "all"}
        onValueChange={(value) => onFiltersChange({ ...filters, status: value as any })}
      >
        <SelectTrigger className="w-[120px] h-9 bg-white border-gray-200" data-testid="customer-status-filter">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="h-9 text-gray-500 hover:text-red-600 hover:bg-red-50"
          data-testid="clear-all-filters"
        >
          <X className="h-4 w-4 mr-1" />
          Clear {activeFilterCount > 1 ? `(${activeFilterCount})` : ""}
        </Button>
      )}

      {/* Export Button */}
      <div className="ml-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isExporting}
          className="h-9 bg-white border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
          data-testid="export-customers-button"
        >
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </div>
    </div>
  )
}
