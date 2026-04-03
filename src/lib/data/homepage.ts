import { prisma } from '@/lib/db'
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

export const getHomepageData = cache(async (): Promise<HomepageData> => {
    return getHomepageCache(async () => {
        try {
            // Single joined query — eliminates N+1 (was: 1 + N separate DB round-trips, now: 1)
            const collectionsData = await (prisma as any).collections.findMany({
                where: { is_active: true },
                orderBy: { created_at: 'desc' },
                take: 4,
                include: {
                    product_collections: {
                        orderBy: { position: 'asc' },
                        take: 12,
                        include: {
                            products: {
                                include: {
                                    product_images: {
                                        orderBy: { sort_order: 'asc' },
                                        take: 2,
                                    },
                                    product_variants: {
                                        include: {
                                            inventory_items: {
                                                select: { quantity: true },
                                            },
                                            variant_images: {
                                                select: { id: true, image_url: true, alt_text: true, position: true },
                                                orderBy: { position: 'asc' },
                                                take: 2,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            }) as any[]

            if (!collectionsData || collectionsData.length === 0) {
                return { collections: [], banners: [], categories: [] }
            }

            const collectionsWithProducts = collectionsData.map((col: any) => {
                const products = (col.product_collections ?? [])
                    .map((pc: any) => pc.products)
                    .filter(Boolean)

                const transformedProducts = transformProducts(products).slice(0, 12)
                return {
                    id: col.id,
                    title: col.title,
                    description: col.description,
                    slug: col.slug,
                    products: transformedProducts,
                }
            })

            const validCollections = collectionsWithProducts.filter((c: any) => c.products.length > 0)
            return { collections: validCollections, banners: [], categories: [] }
        } catch (error) {
            console.error('Error in getHomepageData:', error)
            return { collections: [], banners: [], categories: [] }
        }
    })
})

export async function getHomepageDataSafe(): Promise<HomepageData> {
    try {
        return await getHomepageData()
    } catch (error) {
        console.error('Critical error in getHomepageDataSafe:', error)
        return { collections: [], banners: [], categories: [] }
    }
}
