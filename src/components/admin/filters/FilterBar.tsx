"use client"

import { Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FilterConfig } from "@/hooks/use-admin-filters"
import { FilterDropdown } from "./FilterDropdown"
import { DateRangeFilter } from "./DateRangeFilter"
import { NumberRangeFilter } from "./NumberRangeFilter"
import { FilterChip } from "./FilterChip"

interface FilterBarProps {
    // Search
    search?: string
    onSearchChange?: (value: string) => void
    searchPlaceholder?: string

    // Quick filters (shown in main bar)
    quickFilters?: FilterConfig[]
    filterValues: Record<string, any>
    onFilterChange: (key: string, value: any) => void

    // Active filters
    activeFilters: Array<{
        key: string
        label: string
        value: any
        displayValue: string
        type: FilterConfig['type']
    }>
    onRemoveFilter: (key: string) => void

    // More filters
    hasMoreFilters?: boolean
    onOpenMoreFilters?: () => void
    activeFilterCount?: number

    // Clear all
    onClearAll?: () => void
}

export function FilterBar({
    search,
    onSearchChange,
    searchPlaceholder = "Search...",
    quickFilters = [],
    filterValues,
    onFilterChange,
    activeFilters,
    onRemoveFilter,
    hasMoreFilters = false,
    onOpenMoreFilters,
    activeFilterCount = 0,
    onClearAll,
}: FilterBarProps) {
    const renderFilter = (config: FilterConfig) => {
        const value = filterValues[config.key]

        switch (config.type) {
            case 'date_range':
                return (
                    <DateRangeFilter
                        key={config.key}
                        label={config.label}
                        value={value || null}
                        onChange={(val) => onFilterChange(config.key, val)}
                    />
                )

            case 'number_range':
                return (
                    <NumberRangeFilter
                        key={config.key}
                        label={config.label}
                        value={value || null}
                        onChange={(val) => onFilterChange(config.key, val)}
                        placeholder={config.placeholder as any}
                    />
                )

            case 'enum':
            case 'multi_select':
                return (
                    <FilterDropdown
                        key={config.key}
                        config={config}
                        value={value}
                        onChange={(val) => onFilterChange(config.key, val)}
                    />
                )

            default:
                return null
        }
    }

    return (
        <div className="space-y-4">
            {/* Main Filter Bar */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                {onSearchChange && (
                    <div className="relative flex-1 min-w-[240px] max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={search || ""}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 pr-10"
                        />
                        {search && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                                onClick={() => onSearchChange("")}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                )}

                {/* Quick Filters */}
                {quickFilters.map(config => renderFilter(config))}

                {/* More Filters Button */}
                {hasMoreFilters && onOpenMoreFilters && (
                    <Button
                        variant="outline"
                        onClick={onOpenMoreFilters}
                        className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                        <SlidersHorizontal className="h-4 w-4 mr-2" />
                        More Filters
                        {activeFilterCount > quickFilters.length && (
                            <Badge className="ml-2 bg-red-600 hover:bg-red-700 text-white">
                                {activeFilterCount - quickFilters.length}
                            </Badge>
                        )}
                    </Button>
                )}

                {/* Clear All */}
                {activeFilterCount > 0 && onClearAll && (
                    <Button
                        variant="ghost"
                        onClick={onClearAll}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {activeFilters.map(filter => (
                        <FilterChip
                            key={filter.key}
                            label={filter.label}
                            value={filter.displayValue}
                            onRemove={() => onRemoveFilter(filter.key)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
