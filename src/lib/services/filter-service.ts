"use server"

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

export interface FilterParams {
    categorySlug?: string
    collectionSlug?: string
    minPrice?: number
    maxPrice?: number
    size?: string
    color?: string
    inStock?: boolean
    sortBy?: "newest" | "price_asc" | "price_desc" | "bestseller"
    limit?: number
    offset?: number
}

export interface FilterResult {
    products: FilteredProduct[]
    total: number
    limit: number
    offset: number
}

export interface FilterOption {
    name: string
    hexColor?: string | null
    count?: number
}

export interface FilterOptions {
    sizes: FilterOption[]
    colors: FilterOption[]
    priceRange: { min: number; max: number }
    hasStock: boolean
}

/**
 * Server-side product filtering using Supabase RPC
 * Filters operate on variants, then aggregate to products
 */
export async function filterProducts(params: FilterParams): Promise<FilterResult> {
    const supabase = createClient()

    const { data, error } = await supabase.rpc("filter_products", {
        p_category_slug: params.categorySlug || null,
        p_collection_slug: params.collectionSlug || null,
        p_min_price: params.minPrice || null,
        p_max_price: params.maxPrice || null,
        p_size: params.size || null,
        p_color: params.color || null,
        p_in_stock: params.inStock ?? null,
        p_sort_by: params.sortBy || "newest",
        p_limit: params.limit || 24,
        p_offset: params.offset || 0,
    })

    if (error) {
        console.error("Filter products error:", error)
        return { products: [], total: 0, limit: 24, offset: 0 }
    }

    return data as FilterResult
}

/**
 * Get available filter options for current context
 */
export async function getFilterOptions(
    categorySlug?: string,
    collectionSlug?: string
): Promise<FilterOptions> {
    const supabase = createClient()

    const { data, error } = await supabase.rpc("get_filter_options", {
        p_category_slug: categorySlug || null,
        p_collection_slug: collectionSlug || null,
    })

    if (error) {
        console.error("Get filter options error:", error)
        return {
            sizes: [],
            colors: [],
            priceRange: { min: 0, max: 10000 },
            hasStock: false,
        }
    }

    return data as FilterOptions
}

/**
 * Parse URL search params into FilterParams
 */
export function parseFilterParams(searchParams: URLSearchParams): FilterParams {
    return {
        categorySlug: searchParams.get("category") || undefined,
        collectionSlug: searchParams.get("collection") || undefined,
        minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
        maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
        size: searchParams.get("size") || undefined,
        color: searchParams.get("color") || undefined,
        inStock: searchParams.get("inStock") === "true" ? true :
            searchParams.get("inStock") === "false" ? false : undefined,
        sortBy: (searchParams.get("sort") as FilterParams["sortBy"]) || undefined,
    }
}

/**
 * Build URL search params from FilterParams
 */
export function buildFilterUrl(params: FilterParams, basePath: string = "/products"): string {
    const searchParams = new URLSearchParams()

    if (params.size) searchParams.set("size", params.size)
    if (params.color) searchParams.set("color", params.color)
    if (params.minPrice) searchParams.set("minPrice", String(params.minPrice))
    if (params.maxPrice) searchParams.set("maxPrice", String(params.maxPrice))
    if (params.inStock !== undefined) searchParams.set("inStock", String(params.inStock))
    if (params.sortBy && params.sortBy !== "newest") searchParams.set("sort", params.sortBy)

    const queryString = searchParams.toString()
    return queryString ? `${basePath}?${queryString}` : basePath
}
