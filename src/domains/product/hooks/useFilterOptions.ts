"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

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
 * Hook to fetch available filter options using the get_filter_options RPC
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
                const supabase = createClient()

                // Call the RPC function to get filter options
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data, error: fetchError } = await (supabase.rpc as any)("get_filter_options", {
                    p_category_slug: categorySlug || null,
                    p_collection_slug: collectionSlug || null,
                })

                if (fetchError) throw fetchError

                const result = data as {
                    sizes: FilterOption[]
                    colors: FilterOption[]
                    priceRange: { min: number; max: number }
                    hasStock: boolean
                }

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
            } finally {
                setLoading(false)
            }
        }

        fetchOptions()
    }, [categorySlug, collectionSlug])

    return { sizes, colors, priceRange, loading, error }
}
