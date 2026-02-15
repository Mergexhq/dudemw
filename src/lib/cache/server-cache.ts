import { Redis } from '@upstash/redis'
import { cache } from 'react'

// Initialize Redis client (server-side only)
// Safely check for environment variables before creating client
let redis: Redis | null = null

try {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN
        })
    }
} catch (error) {
    console.warn('Failed to initialize Redis client for server cache:', error)
}

// TTL constants (in seconds)
export const CacheTTL = {
    HOMEPAGE: 600, // 10 minutes
    PRODUCT: 300, // 5 minutes
    COLLECTION: 600, // 10 minutes
    CATEGORY: 900, // 15 minutes
    STATS: 300, // 5 minutes - Dashboard stats
    ANALYTICS: 600, // 10 minutes - Analytics data
} as const

/**
 * Generic cache wrapper with automatic JSON serialization
 */
export async function getCached<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = CacheTTL.PRODUCT
): Promise<T> {
    // If Redis is not available, just call the fallback
    if (!redis) {
        return fallback()
    }

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
        if (!redis) return

        const keys = await redis.keys(pattern)
        if (keys.length > 0) {
            await redis.del(...keys)
        }
    } catch (error) {
        console.error('Redis invalidate error:', error)
        // Swallow error to prevent blocking main flow
    }
}

/**
 * Invalidate multiple patterns
 */
export async function invalidateCacheMultiple(patterns: string[]): Promise<void> {
    await Promise.all(patterns.map(pattern => invalidateCache(pattern)))
}

/**
 * Hierarchical cache invalidation - more granular control
 */
export async function invalidateProductCache(productSlug: string): Promise<void> {
    // Only invalidate specific product + related caches
    await invalidateCacheMultiple([
        `product:${productSlug}`,
        `product:${productSlug}:*`,
        'homepage:featured-products',
        'homepage:new-arrivals',
    ])
    // Don't invalidate ALL products/collections/categories
}

export async function invalidateCollectionCache(collectionSlug: string): Promise<void> {
    await invalidateCacheMultiple([
        `collection:${collectionSlug}`,
        `collection:${collectionSlug}:*`,
        'homepage:collections',
    ])
}

export async function invalidateCategoryCache(categorySlug: string): Promise<void> {
    await invalidateCacheMultiple([
        `category:${categorySlug}`,
        `category:${categorySlug}:*`,
        'categories:all',
    ])
}

/**
 * Stale-While-Revalidate pattern for better UX
 * Serves stale content immediately while refreshing in background
 */
export async function getCachedSWR<T>(
    key: string,
    fallback: () => Promise<T>,
    ttl: number = CacheTTL.PRODUCT,
    staleTTL: number = ttl * 3
): Promise<T> {
    if (!redis) return fallback()

    try {
        const cached = await redis.get(key)
        const cacheAge = await redis.ttl(key)

        // Serve stale content immediately if available
        if (cached) {
            // Background refresh if stale (TTL expired but still within staleTTL)
            if (cacheAge > 0 && cacheAge < ttl) {
                // Still fresh, return immediately
                return cached as T
            } else if (cacheAge < staleTTL) {
                // Stale but acceptable - serve and refresh in background
                fallback().then(data => {
                    redis.setex(key, staleTTL, JSON.stringify(data)).catch(console.error)
                }).catch(console.error)
                return cached as T
            }
        }

        // Cache miss or too stale - fetch fresh
        const data = await fallback()
        redis.setex(key, staleTTL, JSON.stringify(data)).catch(console.error)
        return data
    } catch (error) {
        console.error('Redis SWR error:', error)
        return fallback()
    }
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



/**
 * Additional cache invalidation helpers
 */

export async function invalidateHomepageCache(): Promise<void> {
    await invalidateCache('homepage:*')
}

export async function invalidateAllProductCaches(): Promise<void> {
    await invalidateCacheMultiple([
        'product:*',
        'collection:*',
        'category:*',
        'homepage:*'
    ])
}
