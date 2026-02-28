/**
 * Server-Side Product Filtering
 * Efficient filtering at database level for large product catalogs
 */

import { prisma } from '@/lib/db'
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
    sizes?: string[]
    colors?: string[]
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
        sizes,
        colors,
        sortBy = 'newest',
        page = 1,
        limit = 24
    } = filters

    const cacheKey = `products_list:${category || 'all'}:${collection || 'all'}:${minPrice || 0}:${maxPrice || 0}:${inStock}:${search || ''}:${sortBy}:${page}:${limit}`
    const CACHE_TTL = 300

    return CacheService.withCache(cacheKey, async () => {
        try {
            const where: any = { status: 'published' }

            if (search) {
                where.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ]
            }

            if (minPrice !== undefined) where.price = { ...where.price, gte: minPrice }
            if (maxPrice !== undefined) where.price = { ...where.price, lte: maxPrice }
            if (inStock) where.in_stock = true

            if (category) {
                where.product_categories = { some: { category_id: category } }
            }

            if (collection) {
                where.product_collections = { some: { collection_id: collection } }
            }

            const orderBy: any = sortBy === 'price-asc'
                ? { price: 'asc' }
                : sortBy === 'price-desc'
                    ? { price: 'desc' }
                    : { created_at: 'desc' }

            const [total, products] = await Promise.all([
                prisma.products.count({ where }),
                prisma.products.findMany({
                    where,
                    include: {
                        product_images: true,
                        product_variants: { include: { variant_images: true } },
                    } as any,
                    orderBy,
                    skip: (page - 1) * limit,
                    take: limit,
                }) as any,
            ])

            const totalPages = Math.ceil(total / limit)
            return { products: products as Product[], total, page, totalPages }
        } catch (error) {
            console.error('Error in getFilteredProducts:', error)
            return { products: [], total: 0, page, totalPages: 0 }
        }
    }, CACHE_TTL)
})

export const getFilterOptions = cache(async () => {
    try {
        const [priceAgg, categories] = await Promise.all([
            prisma.products.aggregate({
                where: { status: 'published' } as any,
                _min: { price: true } as any,
                _max: { price: true } as any,
            }) as any,
            prisma.categories.findMany({
                orderBy: { name: 'asc' } as any,
                include: { _count: { select: { product_categories: true } } } as any,
            }) as any[],
        ])

        return {
            priceRange: { min: (priceAgg._min?.price as number) || 0, max: (priceAgg._max?.price as number) || 10000 },
            categories: categories || [],
            tags: []
        }
    } catch (error) {
        console.error('Error fetching filter options:', error)
        return { priceRange: { min: 0, max: 10000 }, categories: [], tags: [] }
    }
})
