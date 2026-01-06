import { createServerSupabase } from '@/lib/supabase/server'
import { cache } from 'react'
import { transformProducts } from '@/domains/product/utils/productUtils'
import type { Product } from '@/domains/product'
import { getHomepageCache } from '@/lib/cache/server-cache'

interface CollectionWithProducts {
    id: string
    title: string
    description?: string | null
    slug: string
    products: Product[]
}

interface HomepageData {
    collections: CollectionWithProducts[]
    banners: any[]
    categories: any[]
}

/**
 * Fetch all homepage data in parallel
 * Cached using React's cache() + Redis for optimal performance
 */
export const getHomepageData = cache(async (): Promise<HomepageData> => {
    // Use Redis cache with fallback to database
    return getHomepageCache(async () => {
        const supabase = await createServerSupabase()

        try {
            // Fetch collections metadata first
            const { data: collectionsData, error: collectionsError } = await supabase
                .from('collections')
                .select('id, title, slug, description')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(4)

            if (collectionsError) {
                console.error('Error fetching collections:', collectionsError)
                return { collections: [], banners: [], categories: [] }
            }

            if (!collectionsData || collectionsData.length === 0) {
                return { collections: [], banners: [], categories: [] }
            }

            // Fetch products for each collection in parallel
            const collectionsWithProducts = await Promise.all(
                collectionsData.map(async (col) => {
                    const { data: collectionProducts, error: productsError } = await supabase
                        .from('product_collections')
                        .select(`
            *,
            product:products (
              *,
              product_images (*),
              product_variants!product_variants_product_id_fkey(
                *,
                variant_images (
                  id,
                  image_url,
                  alt_text,
                  position
                )
              ),
              default_variant:product_variants!products_default_variant_id_fkey(
                *,
                variant_images (
                  id,
                  image_url,
                  alt_text,
                  position
                )
              )
            )
          `)
                        .eq('collection_id', col.id)
                        .order('position', { ascending: true })
                        .limit(8)

                    if (productsError) {
                        console.error(`Error fetching products for collection ${col.id}:`, productsError)
                        return {
                            id: col.id,
                            title: col.title,
                            description: col.description,
                            slug: col.slug,
                            products: []
                        }
                    }

                    const products = collectionProducts?.map(cp => cp.product).filter(Boolean) || []
                    const transformedProducts = transformProducts(products).slice(0, 8)

                    return {
                        id: col.id,
                        title: col.title,
                        description: col.description,
                        slug: col.slug,
                        products: transformedProducts
                    }
                })
            )

            // Filter out collections with no products
            const validCollections = collectionsWithProducts.filter(c => c.products.length > 0)

            return {
                collections: validCollections,
                banners: [], // Banners will be fetched by BannerCarousel component
                categories: [] // Categories will be fetched by CategoryGrid component
            }
        } catch (error) {
            console.error('Error in getHomepageData:', error)
            return { collections: [], banners: [], categories: [] }
        }
    })
})

/**
 * Get homepage data with fallback to empty state
 * Safe for use in components that need guaranteed data
 */
export async function getHomepageDataSafe(): Promise<HomepageData> {
    try {
        return await getHomepageData()
    } catch (error) {
        console.error('Critical error in getHomepageDataSafe:', error)
        return { collections: [], banners: [], categories: [] }
    }
}
