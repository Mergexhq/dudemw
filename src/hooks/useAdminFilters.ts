"use client"

import { useCallback, useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

export interface UseAdminFiltersOptions {
    defaultFilters: Record<string, string>
    onFilterChange?: (filters: Record<string, string>) => void
}

export function useAdminFilters(options: UseAdminFiltersOptions) {
    const { defaultFilters, onFilterChange } = options
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get current filters from URL params
    const filters = useMemo(() => {
        const current: Record<string, string> = { ...defaultFilters }

        searchParams.forEach((value, key) => {
            if (key in defaultFilters) {
                current[key] = value
            }
        })

        return current
    }, [searchParams, defaultFilters])

    // Set a single filter
    const setFilter = useCallback(
        (key: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString())

            if (value === defaultFilters[key] || value === "" || value === "all") {
                params.delete(key)
            } else {
                params.set(key, value)
            }

            const newFilters = { ...filters, [key]: value }

            router.push(`${pathname}?${params.toString()}`, { scroll: false })

            if (onFilterChange) {
                onFilterChange(newFilters)
            }
        },
        [searchParams, pathname, router, defaultFilters, filters, onFilterChange]
    )

    // Set multiple filters at once
    const setFilters = useCallback(
        (newFilters: Record<string, string>) => {
            const params = new URLSearchParams()

            Object.entries(newFilters).forEach(([key, value]) => {
                if (value !== defaultFilters[key] && value !== "" && value !== "all") {
                    params.set(key, value)
                }
            })

            router.push(`${pathname}?${params.toString()}`, { scroll: false })

            if (onFilterChange) {
                onFilterChange(newFilters)
            }
        },
        [pathname, router, defaultFilters, onFilterChange]
    )

    // Clear all filters
    const clearFilters = useCallback(() => {
        router.push(pathname, { scroll: false })

        if (onFilterChange) {
            onFilterChange(defaultFilters)
        }
    }, [pathname, router, defaultFilters, onFilterChange])

    // Count active filters (excluding defaults)
    const activeFilterCount = useMemo(() => {
        return Object.entries(filters).filter(
            ([key, value]) => value !== defaultFilters[key] && value !== "" && value !== "all"
        ).length
    }, [filters, defaultFilters])

    // Get active filters as array
    const activeFilters = useMemo(() => {
        return Object.entries(filters)
            .filter(([key, value]) => value !== defaultFilters[key] && value !== "" && value !== "all")
            .map(([key, value]) => ({ key, value }))
    }, [filters, defaultFilters])

    return {
        filters,
        setFilter,
        setFilters,
        clearFilters,
        activeFilterCount,
        activeFilters,
    }
}
