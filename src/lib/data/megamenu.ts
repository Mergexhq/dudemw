/**
 * Server-side data fetching for megamenu
 * Fetches all categories with products in a single optimized query
 * Eliminates N+1 query problem in MegaMenu component
 */

import { createServerSupabase } from '@/lib/supabase/server'
import { cache } from 'react'
import { CacheService } from '@/lib/services/redis'
import type { Category, Product } from '@/domains/product'

// Supabase query result types
interface ProductImage {
    image_url: string
    alt_text: string | null
    is_primary: boolean | null
}

interface ProductFromQuery {
    id: string
    title: string
    slug: string | null
    price: number | null
    compare_price: number | null
    status: string | null
    is_bestseller: boolean | null
    is_new_drop: boolean | null
    product_images: ProductImage[]
}

interface ProductCategoryJunction {
    products: ProductFromQuery
}

interface CategoryFromQuery {
    id: string
    name: string
    slug: string
    description: string | null
    image_url: string | null
    is_active: boolean | null
    parent_id: string | null
    position?: number | null
    created_at: string | null
    updated_at: string | null
    product_categories: ProductCategoryJunction[]
}

export interface MegaMenuCategory extends Category {
    products: Product[]
}

export interface MegaMenuData {
    categories: MegaMenuCategory[]
}

/**
 * Fetch all megamenu data with products in a single query
 * Uses LEFT JOIN to get products for each category
 * Cached using React's cache() for request deduplication
 * Also uses Redis for persistent caching across requests
 */
export const getMegaMenuData = cache(async (): Promise<MegaMenuData> => {
    const CACHE_KEY = 'megamenu:data'
    const CACHE_TTL = 3600 // 1 hour

    return CacheService.withCache(CACHE_KEY, async () => {
        const supabase = await createServerSupabase()

        try {
            // Fetch categories with products in a single query
            const { data: categories, error } = await supabase
                .from('categories')
                .select(`
        *,
        product_categories!inner(
          products!inner(
            id,
            title,
            slug,
            price,
            compare_price,
            status,
            is_bestseller,
            is_new_drop,
            product_images(
              image_url,
              alt_text,
              is_primary
            )
          )
        )
      `)
                .order('name')

            if (error) {
                console.error('Error fetching megamenu data:', error)
                return { categories: [] }
            }

            // Transform the data to group products by category
            const transformedCategories: MegaMenuCategory[] = (categories || []).map((category: CategoryFromQuery) => {
                // Extract products from junction table
                const products = (category.product_categories || [])
                    .map((pc: ProductCategoryJunction) => pc.products)
                    .filter((product): product is ProductFromQuery => product !== null && product.status === 'published')
                    .slice(0, 8) // Limit to 8 products per category
                    .map((product: ProductFromQuery): Partial<Product> => {
                        // Get primary image or first image
                        const primaryImage = product.product_images?.find((img: ProductImage) => img.is_primary)
                        const firstImage = product.product_images?.[0]
                        const imageUrl = primaryImage?.image_url || firstImage?.image_url || null

                        return {
                            id: product.id,
                            title: product.title,
                            slug: product.slug || product.id,
                            price: product.price ?? 0,
                            compare_price: product.compare_price ?? undefined,
                            // status is not part of Product interface for partial display
                            is_bestseller: product.is_bestseller ?? false,
                            is_new_drop: product.is_new_drop ?? false,
                            product_images: imageUrl ? [{ id: 'temp', product_id: product.id, image_url: imageUrl, is_primary: true }] : [],
                            in_stock: true,
                        }
                    }) as Product[]

                return {
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    description: category.description,
                    image_url: category.image_url,
                    is_active: category.is_active ?? true,
                    parent_id: category.parent_id,
                    position: category.position ?? 0,
                    created_at: category.created_at,
                    updated_at: category.updated_at,
                    products,
                }
            })

            // Filter out categories with no products
            const validCategories = transformedCategories.filter(c => c.products.length > 0)

            return { categories: validCategories }
        } catch (error) {
            console.error('Error in getMegaMenuData:', error)
            return { categories: [] }
        }
    }, CACHE_TTL)
})

/**
 * Safe wrapper with fallback
 */
export async function getMegaMenuDataSafe(): Promise<MegaMenuData> {
    try {
        return await getMegaMenuData()
    } catch (error) {
        console.error('Critical error in getMegaMenuDataSafe:', error)
        return { categories: [] }
    }
}
