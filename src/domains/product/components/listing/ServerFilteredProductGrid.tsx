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
}

interface FilteredProduct {
    id: string
    variant_id: string
    title: string
    slug: string
    description: string | null
    price: number
    mrp: number | null
    stock: number
    options: { size?: string; color?: string }
    variant_image: string | null
    is_bestseller: boolean
    is_new_drop: boolean
    is_featured: boolean
}

/**
 * Server-filtered product grid with right-side filter drawer
 * Full-width layout with Filter button and applied filter chips
 */
export default function ServerFilteredProductGrid({
    categorySlug,
    collectionSlug,
    query,
    title = "All Products",
}: ServerFilteredProductGridProps) {
    const {
        selectedSizes,
        selectedColors,
        priceRange,
        sortBy,
    } = useFilters()

    const [products, setProducts] = useState<FilteredProduct[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

    // Count active filters
    const MIN_PRICE = 299
    const MAX_PRICE = 1999
    const activeFiltersCount = selectedSizes.length + selectedColors.length +
        (priceRange[0] !== MIN_PRICE || priceRange[1] !== MAX_PRICE ? 1 : 0)

    // Map sort option to RPC parameter
    const getSortParam = (sort: string) => {
        switch (sort) {
            case "Price: Low to High": return "price_asc"
            case "Price: High to Low": return "price_desc"
            case "Bestsellers": return "bestseller"
            default: return "newest"
        }
    }

    // Fetch products when filters change
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true)
            try {
                const supabase = createClient()

                const size = selectedSizes.length > 0 ? selectedSizes[0] : null
                const color = selectedColors.length > 0 ? selectedColors[0] : null
                const minPrice = priceRange[0] !== MIN_PRICE ? priceRange[0] : null
                const maxPrice = priceRange[1] !== MAX_PRICE ? priceRange[1] : null

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data, error } = await (supabase.rpc as any)("filter_products", {
                    p_category_slug: categorySlug || null,
                    p_collection_slug: collectionSlug || null,
                    p_min_price: minPrice,
                    p_max_price: maxPrice,
                    p_size: size,
                    p_color: color,
                    p_in_stock: null,
                    p_sort_by: getSortParam(sortBy),
                    p_limit: 24,
                    p_offset: 0,
                })

                if (error) throw error

                const result = data as { products: FilteredProduct[]; total: number }
                setProducts(result.products || [])
                setTotal(result.total || 0)
            } catch (err) {
                console.error("Filter products error:", err)
                setProducts([])
                setTotal(0)
            } finally {
                setLoading(false)
            }
        }

        fetchProducts()
    }, [categorySlug, collectionSlug, selectedSizes, selectedColors, priceRange, sortBy])

    // Transform to Product format
    const transformedProducts = products.map(p => {
        // Calculate discount percentage
        const hasDiscount = p.mrp && p.mrp > p.price
        const discountPercentage = hasDiscount
            ? Math.round(((p.mrp! - p.price) / p.mrp!) * 100)
            : 0

        return {
            id: p.id,
            title: p.title,
            slug: p.slug,
            description: p.description || "",
            price: p.price,
            original_price: p.mrp || undefined,
            images: p.variant_image ? [p.variant_image] : [],
            sizes: [],
            colors: [],
            category_id: "",
            is_featured: p.is_featured,
            is_bestseller: p.is_bestseller,
            is_new_drop: p.is_new_drop,
            is_on_sale: hasDiscount,
            discount_percentage: discountPercentage > 0 ? discountPercentage : undefined,
            in_stock: p.stock > 0,
            created_at: "",
            updated_at: "",
            status: "published",
            default_variant: null,
            product_variants: [{
                id: p.variant_id,
                product_id: p.id,
                name: `${p.options.size || ''} / ${p.options.color || ''}`.trim(),
                sku: "",
                price: p.price,
                stock: p.stock,
                active: true,
                position: 0,
                options: p.options,
                image_url: p.variant_image,
                created_at: "",
                updated_at: "",
            }],
        }
    }) as Product[]

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
                    products={transformedProducts}
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
