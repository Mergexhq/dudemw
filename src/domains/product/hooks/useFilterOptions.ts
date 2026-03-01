"use client"

import { useEffect, useState } from "react"
import { getFilterOptions as getFilterOptionsAction } from "@/lib/services/filter-service"

export interface FilterOption {
    name: string
    hexColor?: string | null
    count?: number
}

export interface FilterOptions {
    sizes: FilterOption[]
    colors: FilterOption[]
    priceRange: { min: number; max: number }
    loading: boolean
    error: string | null
}

/**
 * Hook to fetch available filter options using server action
 * Returns sizes and colors from actual variant data with proper sorting
 */
export function useFilterOptions(
    categorySlug?: string,
    collectionSlug?: string
): FilterOptions {
    const [sizes, setSizes] = useState<FilterOption[]>([])
    const [colors, setColors] = useState<FilterOption[]>([])
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                // Call the server action directly
                const result = await getFilterOptionsAction(categorySlug, collectionSlug)

                // Sort sizes: numbers first (ascending), then letter sizes
                const sortedSizes = [...(result.sizes || [])].sort((a, b) => {
                    const aNum = parseInt(a.name)
                    const bNum = parseInt(b.name)
                    const aIsNum = !isNaN(aNum)
                    const bIsNum = !isNaN(bNum)

                    if (aIsNum && bIsNum) return aNum - bNum
                    if (aIsNum) return -1
                    if (bIsNum) return 1

                    const sizeOrder = ["S", "M", "L", "XL", "XXL", "3XL", "4XL"]
                    const aIndex = sizeOrder.indexOf(a.name.toUpperCase())
                    const bIndex = sizeOrder.indexOf(b.name.toUpperCase())

                    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
                    if (aIndex !== -1) return -1
                    if (bIndex !== -1) return 1
                    return a.name.localeCompare(b.name)
                })

                setSizes(sortedSizes)
                setColors(result.colors || [])
                setPriceRange(result.priceRange || { min: 0, max: 10000 })
            } catch (err: any) {
                console.error("Failed to fetch filter options:", err)
                setError(err.message || "Failed to fetch filter options")
                // Set empty defaults
                setSizes([])
                setColors([])
                setPriceRange({ min: 0, max: 10000 })
            } finally {
                setLoading(false)
            }
        }

        fetchOptions()
    }, [categorySlug, collectionSlug])

    return { sizes, colors, priceRange, loading, error }
}
