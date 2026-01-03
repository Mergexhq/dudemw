"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import {
    parseFiltersFromURL,
    serializeFiltersToURL,
    validateFilterValue,
    getFilterDisplayValue,
    countActiveFilters,
} from "@/lib/utils/filters"

export interface FilterConfig {
    key: string
    label: string
    type: 'enum' | 'date_range' | 'number_range' | 'boolean' | 'multi_select'
    options?: { label: string; value: string }[]
    placeholder?: string | { min?: string; max?: string }
    defaultValue?: any
}

export interface ActiveFilter {
    key: string
    label: string
    value: any
    displayValue: string
    type: FilterConfig['type']
}

interface UseAdminFiltersOptions {
    configs: FilterConfig[]
    defaultFilters?: Record<string, any>
    onFilterChange?: (filters: Record<string, any>) => void
}

export function useAdminFilters(options: UseAdminFiltersOptions) {
    const { configs, defaultFilters = {}, onFilterChange } = options
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Parse initial filters from URL
    const [filters, setFilters] = useState<Record<string, any>>(() => {
        const urlFilters = parseFiltersFromURL(searchParams)
        return { ...defaultFilters, ...urlFilters }
    })

    // Sync filters to URL
    const syncToURL = useCallback((newFilters: Record<string, any>) => {
        const params = serializeFiltersToURL(newFilters)

        // Preserve search and page params
        const search = searchParams.get('search')
        const sort = searchParams.get('sort')

        if (search) params.set('search', search)
        if (sort) params.set('sort', sort)

        // Reset to page 1 when filters change
        params.set('page', '1')

        const newURL = `${pathname}?${params.toString()}`
        router.push(newURL, { scroll: false })
    }, [pathname, router, searchParams])

    // Set a single filter
    const setFilter = useCallback((key: string, value: any) => {
        const config = configs.find(c => c.key === key)
        if (!config) return

        // Validate value
        if (!validateFilterValue(value, config.type)) {
            console.warn(`Invalid filter value for ${key}:`, value)
            return
        }

        setFilters(prev => {
            const newFilters = { ...prev, [key]: value }
            syncToURL(newFilters)
            onFilterChange?.(newFilters)
            return newFilters
        })
    }, [configs, syncToURL, onFilterChange])

    // Remove a single filter
    const removeFilter = useCallback((key: string) => {
        setFilters(prev => {
            const newFilters = { ...prev }
            delete newFilters[key]
            syncToURL(newFilters)
            onFilterChange?.(newFilters)
            return newFilters
        })
    }, [syncToURL, onFilterChange])

    // Clear all filters
    const clearFilters = useCallback(() => {
        setFilters(defaultFilters)
        syncToURL(defaultFilters)
        onFilterChange?.(defaultFilters)
    }, [defaultFilters, syncToURL, onFilterChange])

    // Apply multiple filters at once
    const applyFilters = useCallback((newFilters: Record<string, any>) => {
        // Validate all filters
        const validFilters: Record<string, any> = {}
        Object.entries(newFilters).forEach(([key, value]) => {
            const config = configs.find(c => c.key === key)
            if (config && validateFilterValue(value, config.type)) {
                validFilters[key] = value
            }
        })

        setFilters(validFilters)
        syncToURL(validFilters)
        onFilterChange?.(validFilters)
    }, [configs, syncToURL, onFilterChange])

    // Get active filters with display values
    const activeFilters: ActiveFilter[] = configs
        .filter(config => {
            const value = filters[config.key]
            if (value === null || value === undefined || value === '') return false

            // Check range filters
            if (typeof value === 'object' && !Array.isArray(value)) {
                return (
                    (value.min !== undefined && value.min !== '') ||
                    (value.max !== undefined && value.max !== '') ||
                    (value.from !== undefined && value.from !== '') ||
                    (value.to !== undefined && value.to !== '')
                )
            }

            // Check arrays
            if (Array.isArray(value)) {
                return value.length > 0
            }

            return true
        })
        .map(config => ({
            key: config.key,
            label: config.label,
            value: filters[config.key],
            displayValue: getFilterDisplayValue(
                filters[config.key],
                config.type,
                config.options
            ),
            type: config.type,
        }))

    // Count active filters
    const activeCount = countActiveFilters(filters)

    // Get filter value
    const getFilter = useCallback((key: string) => {
        return filters[key]
    }, [filters])

    // Check if filter is active
    const isFilterActive = useCallback((key: string) => {
        const value = filters[key]
        if (value === null || value === undefined || value === '') return false

        if (typeof value === 'object' && !Array.isArray(value)) {
            return (
                (value.min !== undefined && value.min !== '') ||
                (value.max !== undefined && value.max !== '') ||
                (value.from !== undefined && value.from !== '') ||
                (value.to !== undefined && value.to !== '')
            )
        }

        if (Array.isArray(value)) {
            return value.length > 0
        }

        return true
    }, [filters])

    // Sync URL changes back to state
    useEffect(() => {
        const urlFilters = parseFiltersFromURL(searchParams)
        setFilters(prev => {
            const merged = { ...defaultFilters, ...urlFilters }
            // Only update if different
            if (JSON.stringify(prev) !== JSON.stringify(merged)) {
                return merged
            }
            return prev
        })
    }, [searchParams, defaultFilters])

    return {
        filters,
        setFilter,
        removeFilter,
        clearFilters,
        applyFilters,
        activeFilters,
        activeCount,
        getFilter,
        isFilterActive,
    }
}
