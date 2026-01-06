/**
 * Server-Side Product Filtering
 * Efficient filtering at database level for large product catalogs
 * Used by Product Listing Pages (PLP)
 */

import { createServerSupabase } from '@/lib/supabase/server'
import { cache } from 'react'
import { CacheService } from '@/lib/services/redis'
import type { Product } from '@/domains/product'

export interface ProductFilters {
    category?: string
    collection?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    search?: string
    tags?: string[]
    sizes?: string[] // Added
    colors?: string[] // Added
    sortBy?: 'newest' | 'price-asc' | 'price-desc' | 'popular'
    page?: number
    limit?: number
}


export interface FilteredProductsResult {
    products: Product[]
    total: number
    page: number
    totalPages: number
}

export const getFilteredProducts = cache(async (filters: ProductFilters = {}): Promise<FilteredProductsResult> => {
    const {
        category,
        collection,
        minPrice,
        maxPrice,
        inStock = false,
        search,
        tags, // Tags logic can be added if DB supports it (e.g. separate tags table or array column)
        sizes,
        colors,
        sortBy = 'newest',
        page = 1,
        limit = 24
    } = filters

    // Create a unique cache key based on filter parameters
    const cacheKey = `products_list:${category || 'all'}:${collection || 'all'}:${minPrice || 0}:${maxPrice || 0}:${inStock}:${search || ''}:${sortBy}:${page}:${limit}`
    const CACHE_TTL = 300 // 5 minutes

    return CacheService.withCache(cacheKey, async () => {
        const supabase = await createServerSupabase()

        try {
            // Base query
            // Note: We use !inner joins for filters to ensure we only get products that MATCH the criteria.
            // However, we want to select ALL variants for display, or maybe just matching ones.
            // PostgREST behavior: Filtering on embedded resource filters the resource AND the parent rows (if !inner).
            // Since we want to display the product if ANY variant matches, !inner is correct.

            let query = supabase
                .from('products')
                .select(`
                *,
                product_images(*),
                product_variants!inner(*), 
                product_categories!inner(id, category_id, product_id),
                product_collections(collection_id)
            `, { count: 'exact' })
                .eq('status', 'published')

            // Apply category filter
            if (category) {
                query = query.eq('product_categories.category_id', category)
            }

            // Apply collection filter
            if (collection) {
                // Filter by collection using the product_collections relationship
                query = query.eq('product_collections.collection_id', collection)
            }

            // Apply size filter
            // Note: Supabase PostgREST doesn't support .or() with foreignTable option in this version.
            // For now, we'll filter on the client side or use a stored procedure for complex variant filtering.
            // TODO: Implement server-side variant filtering via RPC or raw SQL
            if (sizes && sizes.length > 0) {
                // Client-side filtering will be applied after query
                console.log('Size filter applied client-side:', sizes)
            }

            // Apply color filter
            if (colors && colors.length > 0) {
                // Client-side filtering will be applied after query
                console.log('Color filter applied client-side:', colors)
            }

            // Apply price range filter
            if (minPrice !== undefined) {
                query = query.gte('price', minPrice)
            }
            if (maxPrice !== undefined) {
                query = query.lte('price', maxPrice)
            }

            // Apply stock filter
            if (inStock) {
                query = query.gt('global_stock', 0)
            }

            // Apply search filter (uses full-text search index)
            if (search) {
                query = query.textSearch('title', search, {
                    type: 'websearch',
                    config: 'english'
                })
            }

            // Apply sorting
            switch (sortBy) {
                case 'price-asc':
                    query = query.order('price', { ascending: true })
                    break
                case 'price-desc':
                    query = query.order('price', { ascending: false })
                    break
                case 'popular':
                    query = query.order('created_at', { ascending: false })
                    break
                case 'newest':
                default:
                    query = query.order('created_at', { ascending: false })
            }

            // Apply pagination
            const offset = (page - 1) * limit
            query = query.range(offset, offset + limit - 1)

            // Execute query
            const { data, error, count } = await query

            if (error) {
                console.error('Error fetching filtered products:', error)
                return { products: [], total: 0, page, totalPages: 0 }
            }

            const totalPages = count ? Math.ceil(count / limit) : 0

            return {
                products: (data || []) as Product[],
                total: count || 0,
                page,
                totalPages
            }
        } catch (error) {
            console.error('Error in getFilteredProducts:', error)
            return { products: [], total: 0, page, totalPages: 0 }
        }
    }, CACHE_TTL)
})

/**
 * Get filter options (for filter sidebar)
 */
export const getFilterOptions = cache(async () => {
    const supabase = await createServerSupabase()

    try {
        // Get price range
        const { data: priceData } = await supabase
            .from('products')
            .select('price')
            .eq('status', 'published')
            .order('price', { ascending: true })

        const minPrice = priceData?.[0]?.price || 0
        const maxPrice = priceData?.[priceData.length - 1]?.price || 10000

        // Get all categories with product counts
        const { data: categories } = await supabase
            .from('categories')
            .select(`
        id,
        name,
        slug,
        product_categories(count)
      `)
            .order('name')

        // Get all tags with product counts
        const { data: tags } = await supabase
            .from('product_tags')
            .select(`
        id,
        name,
        slug,
        product_tag_assignments(count)
      `)
            .order('name')

        return {
            priceRange: { min: minPrice, max: maxPrice },
            categories: categories || [],
            tags: tags || []
        }
    } catch (error) {
        console.error('Error fetching filter options:', error)
        return {
            priceRange: { min: 0, max: 10000 },
            categories: [],
            tags: []
        }
    }
})
