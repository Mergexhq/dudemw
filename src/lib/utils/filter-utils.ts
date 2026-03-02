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

/**
 * Get active filters with human readable labels
 */
export function getActiveFiltersWithLabels(filters: Record<string, any>, defaultFilters: Record<string, any>): { key: string; label: string; value: string }[] {
    const active: { key: string; label: string; value: string }[] = []
    for (const key in filters) {
        if (filters[key] !== undefined && filters[key] !== '' && filters[key] !== defaultFilters[key]) {
            active.push({
                key,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1').trim(),
                value: String(filters[key])
            })
        }
    }
    return active
}
