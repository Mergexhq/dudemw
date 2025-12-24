"use client"

import { useEffect, useState, useCallback } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export interface FilteredProduct {
    id: string
    variant_id: string
    title: string
    slug: string
    description: string | null
    price: number
    original_price: number | null
    stock: number
    options: { size?: string; color?: string }
    variant_image: string | null
    is_bestseller: boolean
    is_new_drop: boolean
    is_featured: boolean
}

export interface ServerFilterState {
    products: FilteredProduct[]
    total: number
    loading: boolean
    error: string | null
    // Active filters (from URL)
    size: string | null
    color: string | null
    minPrice: number | null
    maxPrice: number | null
    sortBy: string
    inStock: boolean | null
    // Actions
    setFilter: (key: string, value: string | null) => void
    clearFilters: () => void
}

/**
 * Hook for server-side filtering with URL-based state
 * Filters operate on variants via Supabase RPC
 */
export function useServerFilter(
    categorySlug?: string,
    collectionSlug?: string
): ServerFilterState {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const [products, setProducts] = useState<FilteredProduct[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Read filter values from URL
    const size = searchParams.get("size")
    const color = searchParams.get("color")
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : null
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : null
    const sortBy = searchParams.get("sort") || "newest"
    const inStock = searchParams.get("inStock") === "true" ? true :
        searchParams.get("inStock") === "false" ? false : null

    // Update URL with new filter value
    const setFilter = useCallback((key: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString())

        if (value === null || value === "") {
            params.delete(key)
        } else {
            params.set(key, value)
        }

        const queryString = params.toString()
        router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
    }, [searchParams, router, pathname])

    // Clear all filters
    const clearFilters = useCallback(() => {
        router.push(pathname, { scroll: false })
    }, [router, pathname])

    // Fetch filtered products from server
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            setError(null)

            try {
                const supabase = createClient()

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data, error: rpcError } = await (supabase.rpc as any)("filter_products", {
                    p_category_slug: categorySlug || null,
                    p_collection_slug: collectionSlug || null,
                    p_min_price: minPrice,
                    p_max_price: maxPrice,
                    p_size: size,
                    p_color: color,
                    p_in_stock: inStock,
                    p_sort_by: sortBy === "price_low" ? "price_asc" :
                        sortBy === "price_high" ? "price_desc" :
                            sortBy === "bestseller" ? "bestseller" : "newest",
                    p_limit: 24,
                    p_offset: 0,
                })

                if (rpcError) throw rpcError

                const result = data as { products: FilteredProduct[]; total: number }
                setProducts(result.products || [])
                setTotal(result.total || 0)
            } catch (err: any) {
                console.error("Server filter error:", err)
                setError(err.message || "Failed to fetch products")
                setProducts([])
                setTotal(0)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [categorySlug, collectionSlug, size, color, minPrice, maxPrice, sortBy, inStock])

    return {
        products,
        total,
        loading,
        error,
        size,
        color,
        minPrice,
        maxPrice,
        sortBy,
        inStock,
        setFilter,
        clearFilters,
    }
}
