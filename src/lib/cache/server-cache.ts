/**
 * Server-Side Redis Caching Utility
 * Provides server-side caching for Server Components
 * Replaces client-side Redis usage for better performance
 */

import { Redis } from '@upstash/redis'
import { cache } from 'react'

// Initialize Redis client (server-side only)
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

// TTL constants (in seconds)
export const CacheTTL = {
    HOMEPAGE: 600, // 10 minutes
    PRODUCT: 300, // 5 minutes
    COLLECTION: 600, // 10 minutes
    CATEGORY: 900, // 15 minutes
    MEGAMENU: 3600, // 1 hour
} as const

/**
 * Generic cache wrapper with automatic JSON serialization
 */
export async function getCached<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = CacheTTL.PRODUCT
): Promise<T> {
    try {
        // Try to get from cache
        const cached = await redis.get(key)

        if (cached) {
            return cached as T
        }

        // Cache miss - fetch data
        const data = await fallback()

        // Store in cache (fire and forget)
        redis.setex(key, ttl, JSON.stringify(data)).catch(err => {
            console.error('Redis cache set error:', err)
        })

        return data
    } catch (error) {
        console.error('Redis cache error:', error)
        // On error, bypass cache and call fallback directly
        return fallback()
    }
}

/**
 * Invalidate cache by key pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
    try {
        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
            await redis.del(...keys)
        }
    } catch (error) {
        console.error('Redis invalidate error:', error)
    }
}

/**
 * Invalidate multiple patterns
 */
export async function invalidateCacheMultiple(patterns: string[]): Promise<void> {
    await Promise.all(patterns.map(pattern => invalidateCache(pattern)))
}

/**
 * Specific cache functions
 */

export const getHomepageCache = cache(async <T>(fallback: () => Promise<T>): Promise<T> => {
    return getCached('homepage:data', fallback, CacheTTL.HOMEPAGE)
})

export const getProductCache = cache(async <T>(productId: string, fallback: () => Promise<T>): Promise<T> => {
    return getCached(`product:${productId}`, fallback, CacheTTL.PRODUCT)
})

export const getCollectionCache = cache(async <T>(collectionId: string, fallback: () => Promise<T>): Promise<T> => {
    return getCached(`collection:${collectionId}`, fallback, CacheTTL.COLLECTION)
})

export const getCategoryCache = cache(async <T>(categorySlug: string, fallback: () => Promise<T>): Promise<T> => {
    return getCached(`category:${categorySlug}`, fallback, CacheTTL.CATEGORY)
})

export const getMegaMenuCache = cache(async <T>(fallback: () => Promise<T>): Promise<T> => {
    return getCached('megamenu:data', fallback, CacheTTL.MEGAMENU)
})

/**
 * Cache invalidation helpers (call from admin actions)
 */

export async function invalidateProductCache(productId: string): Promise<void> {
    await invalidateCacheMultiple([
        `product:${productId}`,
        'homepage:*',
        'collection:*',
        'category:*'
    ])
}

export async function invalidateCollectionCache(collectionId: string): Promise<void> {
    await invalidateCacheMultiple([
        `collection:${collectionId}`,
        'homepage:*'
    ])
}

export async function invalidateCategoryCache(categorySlug: string): Promise<void> {
    await invalidateCacheMultiple([
        `category:${categorySlug}`,
        'megamenu:*',
        'homepage:*'
    ])
}

export async function invalidateHomepageCache(): Promise<void> {
    await invalidateCache('homepage:*')
}

export async function invalidateAllProductCaches(): Promise<void> {
    await invalidateCacheMultiple([
        'product:*',
        'collection:*',
        'category:*',
        'homepage:*',
        'megamenu:*'
    ])
}
