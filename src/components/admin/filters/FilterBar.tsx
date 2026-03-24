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
    onSearchSubmit?: () => void
    onSearchKeyDown?: (e: React.KeyboardEvent) => void
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
    onSearchSubmit,
    onSearchKeyDown,
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
            <div className="flex flex-nowrap items-center gap-2 md:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {/* Search */}
                {onSearchChange && (
                    <div className="relative flex-none w-[200px] md:flex-1 md:min-w-[240px] md:max-w-4xl">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 md:h-4 md:w-4 text-gray-400" />
                        <Input
                            placeholder={searchPlaceholder}
                            value={search || ""}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onKeyDown={onSearchKeyDown}
                            className="pl-8 md:pl-10 pr-8 md:pr-10 h-8 md:h-10 text-xs md:text-sm"
                        />
                        {search && onSearchSubmit && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-0.5 top-1/2 transform -translate-y-1/2 h-7 w-7 text-gray-600 hover:text-gray-900"
                                onClick={onSearchSubmit}
                                title="Search"
                            >
                                <Search className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                )}

                {/* Quick Filters */}
                <div className="flex flex-nowrap gap-2">
                    {quickFilters.map(config => renderFilter(config))}
                </div>

                {/* More Filters Button */}
                {hasMoreFilters && onOpenMoreFilters && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onOpenMoreFilters}
                        className="flex-none border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 h-8 md:h-10 text-xs md:text-sm whitespace-nowrap"
                    >
                        <SlidersHorizontal className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">More Filters</span>
                        <span className="sm:hidden">Filters</span>
                        {activeFilterCount > quickFilters.length && (
                            <Badge className="ml-1 md:ml-2 bg-red-600 hover:bg-red-700 text-white px-1 h-4 min-w-4 flex items-center justify-center">
                                {activeFilterCount - quickFilters.length}
                            </Badge>
                        )}
                    </Button>
                )}

                {/* Clear All */}
                {activeFilterCount > 0 && onClearAll && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAll}
                        className="flex-none text-gray-600 hover:text-gray-900 h-8 md:h-10 text-xs md:text-sm whitespace-nowrap"
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
