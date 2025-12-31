"use client"

import { AdminSearchBar } from "./AdminSearchBar"
import { AdminFilterSelect, FilterOption } from "./AdminFilterSelect"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Filter, RefreshCw, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface FilterConfig {
    key: string
    label: string
    placeholder: string
    options: FilterOption[]
    icon?: LucideIcon
    width?: string
}

export interface ActiveFilterChip {
    key: string
    label: string
    value: string
}

interface AdminFiltersProps {
    searchValue: string
    onSearchChange: (value: string) => void
    searchPlaceholder?: string
    filters: FilterConfig[]
    filterValues: Record<string, string>
    onFilterChange: (key: string, value: string) => void
    onClearAll: () => void
    activeFilters?: ActiveFilterChip[]
    totalCount?: number
    isLoading?: boolean
    showActiveChips?: boolean
    className?: string
    rightActions?: React.ReactNode
}

export function AdminFilters({
    searchValue,
    onSearchChange,
    searchPlaceholder = "Search...",
    filters,
    filterValues,
    onFilterChange,
    onClearAll,
    activeFilters = [],
    totalCount,
    isLoading = false,
    showActiveChips = true,
    className,
    rightActions,
}: AdminFiltersProps) {
    const hasActiveFilters = activeFilters.length > 0

    return (
        <div className={cn("space-y-4", className)}>
            {/* Main Filter Bar */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Search */}
                <AdminSearchBar
                    value={searchValue}
                    onChange={onSearchChange}
                    placeholder={searchPlaceholder}
                    disabled={isLoading}
                />

                {/* Filter Selects */}
                {filters.map((filter) => (
                    <AdminFilterSelect
                        key={filter.key}
                        value={filterValues[filter.key] || "all"}
                        onChange={(value) => onFilterChange(filter.key, value)}
                        options={filter.options}
                        placeholder={filter.placeholder}
                        icon={filter.icon}
                        disabled={isLoading}
                        className={filter.width}
                    />
                ))}

                {/* Clear All Button */}
                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAll}
                        disabled={isLoading}
                        className="h-10 text-gray-500 hover:text-red-600 hover:bg-red-50 px-3"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset
                        {activeFilters.length > 1 && (
                            <span className="ml-1">({activeFilters.length})</span>
                        )}
                    </Button>
                )}

                {/* Right Actions (Export, etc.) */}
                {rightActions && (
                    <div className="ml-auto flex items-center gap-2">
                        {rightActions}
                    </div>
                )}

                {/* Total Count */}
                {totalCount !== undefined && !rightActions && (
                    <div className="ml-auto text-sm text-gray-500 font-medium">
                        {totalCount} {totalCount === 1 ? "item" : "items"}
                    </div>
                )}
            </div>

            {/* Active Filter Chips */}
            {showActiveChips && hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                        <Filter className="h-3 w-3 mr-1" />
                        Active Filters:
                    </div>

                    {activeFilters.map((filter) => (
                        <Badge
                            key={filter.key}
                            variant="secondary"
                            className="pl-2 pr-1 py-0.5 bg-red-50 text-red-700 border-red-100 flex items-center gap-1 group max-w-[250px]"
                        >
                            <span className="truncate">{filter.label}</span>
                            <button
                                onClick={() => onFilterChange(filter.key, "all")}
                                className="hover:bg-red-200 rounded-full p-0.5 transition-colors"
                                aria-label={`Clear ${filter.label}`}
                                type="button"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAll}
                        className="text-[10px] h-6 px-2 text-gray-400 hover:text-red-600 uppercase tracking-wider font-bold"
                    >
                        Clear All
                    </Button>
                </div>
            )}
        </div>
    )
}
