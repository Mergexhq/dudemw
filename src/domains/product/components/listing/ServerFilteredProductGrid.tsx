"use client"

import { useEffect, useState } from "react"
import { SlidersHorizontal } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useFilters } from "../../hooks/FilterContext"
import ProductGrid from "../cards/ProductGrid"
import AppliedFiltersChips from "../listing/AppliedFiltersChips"
import FilterDrawer from "../listing/FilterDrawer"
import { Product } from "@/domains/product"


interface ServerFilteredProductGridProps {
    categorySlug?: string
    collectionSlug?: string
    query?: string
    title?: string
    initialProducts?: Product[]
    totalCount?: number
}

// ... (FilteredProduct interface remains but might be redundant if using Product type) ...

// Helper to transform Product to FilteredProduct if needed
// Or better: Update component to use Product[] directly as state.
// Since we are moving to standard Product type, let's use that.

export default function ServerFilteredProductGrid({
    categorySlug,
    collectionSlug,
    query,
    title = "All Products",
    initialProducts = [],
    totalCount = 0
}: ServerFilteredProductGridProps) {
    const {
        selectedSizes,
        selectedColors,
        priceRange,
        sortBy,
    } = useFilters()

    // Use initial products if available
    const [products, setProducts] = useState<Product[]>(initialProducts)
    const [total, setTotal] = useState(totalCount)
    const [loading, setLoading] = useState(false)
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

    // Sync state when props change (Server Re-render)
    useEffect(() => {
        if (initialProducts) {
            setProducts(initialProducts)
            setTotal(totalCount)
            setLoading(false)
        }
    }, [initialProducts, totalCount])

    // Count active filters
    const MIN_PRICE = 299
    const MAX_PRICE = 1999
    const activeFiltersCount = selectedSizes.length + selectedColors.length +
        (priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE ? 1 : 0)

    // We no longer need client-side fetching if we are driving via URL!
    // But if we want to support "transition" states or if FilterContext doesn't trigger reload yet, we might need it.
    // However, our plan is URL-driven.
    // So we can remove the useEffect fetcher!

    // ... (removed useEffect fetcher) ...


    // No transformation needed if products are already Product[]

    const hasResults = products.length > 0

    return (
        <>
            {/* Header: Title + Filter Button */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-2xl font-bold tracking-wide text-black md:text-3xl">
                    {title}
                </h2>
                <button
                    onClick={() => setFilterDrawerOpen(true)}
                    className="flex items-center gap-2 rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-medium transition-colors hover:border-red-600 hover:text-red-600"
                >
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Filters</span>
                    {activeFiltersCount > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Applied Filter Chips */}
            <AppliedFiltersChips />

            {/* Product Count */}
            <div className="mb-4">
                <p className="text-sm text-gray-600">
                    {loading ? "Loading..." : `Showing ${products.length} of ${total} products`}
                </p>
            </div>

            {/* Product Grid */}
            {loading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-square rounded-lg bg-gray-200" />
                            <div className="mt-2 h-4 w-3/4 rounded bg-gray-200" />
                            <div className="mt-1 h-4 w-1/2 rounded bg-gray-200" />
                        </div>
                    ))}
                </div>
            ) : hasResults ? (
                <ProductGrid
                    products={products}
                    selectedColor={selectedColors.length > 0 ? selectedColors[0] : undefined}
                    selectedSize={selectedSizes.length > 0 ? selectedSizes[0] : undefined}
                />
            ) : (
                <div className="py-12 text-center">
                    <p className="text-gray-600">No products match your selected filters.</p>
                    <p className="text-sm text-gray-500 mt-2">Try adjusting your filters to see more products.</p>
                </div>
            )}

            {/* Filter Drawer */}
            <FilterDrawer
                isOpen={filterDrawerOpen}
                onClose={() => setFilterDrawerOpen(false)}
                totalProducts={total}
                categorySlug={categorySlug}
                collectionSlug={collectionSlug}
            />
        </>
    )
}
