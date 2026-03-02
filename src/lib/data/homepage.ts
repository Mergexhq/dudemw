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
            const collectionsData = await prisma.collections.findMany({
                where: { is_active: true } as any,
                select: { id: true, title: true, slug: true, description: true } as any,
                orderBy: { created_at: 'desc' } as any,
                take: 4,
            }) as any[]

            if (!collectionsData || collectionsData.length === 0) {
                return { collections: [], banners: [], categories: [] }
            }

            const collectionsWithProducts = await Promise.all(
                collectionsData.map(async (col: any) => {
                    const collectionProducts = await prisma.product_collections.findMany({
                        where: { collection_id: col.id } as any,
                        include: {
                            products: {
                                include: {
                                    product_images: true,
                                    product_variants: {
                                        include: { variant_images: { select: { id: true, image_url: true, alt_text: true, position: true } } },
                                    },
                                },
                            },
                        } as any,
                        orderBy: { position: 'asc' } as any,
                        take: 8,
                    }) as any[]

                    const products = collectionProducts.map((cp: any) => cp.products).filter(Boolean)
                    const transformedProducts = transformProducts(products).slice(0, 8)

                    return { id: col.id, title: col.title, description: col.description, slug: col.slug, products: transformedProducts }
                })
            )

            const validCollections = collectionsWithProducts.filter(c => c.products.length > 0)
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
