import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client
let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (error) {
  console.warn('Failed to initialize Redis client:', error);
}

export { redis };

/**
 * Cache utilities for e-commerce operations
 */
export class CacheService {
  private static readonly PREFIXES = {
    PRODUCT: 'product:',
    PRODUCTS_LIST: 'products_list:',
    COLLECTION: 'collection:',
    COLLECTIONS_LIST: 'collections_list:',
    CATEGORY: 'category:',
    CATEGORIES_LIST: 'categories_list:',
    BANNER: 'banner:',
    BANNERS_LIST: 'banners_list:',
    CART: 'cart:',
    SESSION: 'session:',
    RATE_LIMIT: 'rate_limit:',
    HOMEPAGE: 'homepage:',
  } as const;

  // Default TTLs in seconds
  private static readonly TTL = {
    PRODUCT: 3600,        // 1 hour
    COLLECTION: 1800,     // 30 minutes
    CATEGORY: 3600,       // 1 hour
    BANNER: 300,          // 5 minutes (more dynamic)
    CART: 86400,          // 24 hours
    SESSION: 86400,       // 24 hours
    HOMEPAGE: 600,        // 10 minutes
  } as const;

  /**
   * Check if Redis is available
   */
  static isAvailable(): boolean {
    return redis !== null;
  }

  /**
   * Generic cache wrapper - wrap any async function with caching
   */
  static async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600
  ): Promise<T> {
    if (!redis) {
      // If Redis is not available, just call the fetcher
      return fetcher();
    }

    try {
      // Try to get from cache
      const cached = await redis.get(key);
      if (cached) {
        return typeof cached === 'string' ? JSON.parse(cached) : cached as T;
      }
    } catch (error) {
      console.warn('Redis get error:', error);
    }

    // Fetch fresh data
    const data = await fetcher();

    // Try to cache the result
    try {
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Redis set error:', error);
    }

    return data;
  }

  // ============== PRODUCT CACHING ==============

  /**
   * Cache product data
   */
  static async cacheProduct(productId: string, data: any, ttl = this.TTL.PRODUCT) {
    if (!redis) return;
    try {
      const key = `${this.PREFIXES.PRODUCT}${productId}`;
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache product:', error);
    }
  }

  /**
   * Get cached product
   */
  static async getCachedProduct(productId: string) {
    if (!redis) return null;
    try {
      const key = `${this.PREFIXES.PRODUCT}${productId}`;
      const cached = await redis.get(key);
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
    } catch (error) {
      console.warn('Failed to get cached product:', error);
      return null;
    }
  }

  /**
   * Cache products list (with filters as key)
   */
  static async cacheProductsList(cacheKey: string, data: any, ttl = this.TTL.PRODUCT) {
    if (!redis) return;
    try {
      const key = `${this.PREFIXES.PRODUCTS_LIST}${cacheKey}`;
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache products list:', error);
    }
  }

  static async getCachedProductsList(cacheKey: string) {
    if (!redis) return null;
    try {
      const key = `${this.PREFIXES.PRODUCTS_LIST}${cacheKey}`;
      const cached = await redis.get(key);
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
    } catch (error) {
      console.warn('Failed to get cached products list:', error);
      return null;
    }
  }

  // ============== COLLECTION CACHING ==============

  /**
   * Cache collection data
   */
  static async cacheCollection(collectionId: string, data: any, ttl = this.TTL.COLLECTION) {
    if (!redis) return;
    try {
      const key = `${this.PREFIXES.COLLECTION}${collectionId}`;
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache collection:', error);
    }
  }

  /**
   * Get cached collection
   */
  static async getCachedCollection(collectionId: string) {
    if (!redis) return null;
    try {
      const key = `${this.PREFIXES.COLLECTION}${collectionId}`;
      const cached = await redis.get(key);
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
    } catch (error) {
      console.warn('Failed to get cached collection:', error);
      return null;
    }
  }

  // ============== CATEGORY CACHING ==============

  /**
   * Cache category data
   */
  static async cacheCategory(categorySlug: string, data: any, ttl = this.TTL.CATEGORY) {
    if (!redis) return;
    try {
      const key = `${this.PREFIXES.CATEGORY}${categorySlug}`;
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache category:', error);
    }
  }

  /**
   * Get cached category
   */
  static async getCachedCategory(categorySlug: string) {
    if (!redis) return null;
    try {
      const key = `${this.PREFIXES.CATEGORY}${categorySlug}`;
      const cached = await redis.get(key);
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
    } catch (error) {
      console.warn('Failed to get cached category:', error);
      return null;
    }
  }

  /**
   * Cache all categories list
   */
  static async cacheAllCategories(data: any, ttl = this.TTL.CATEGORY) {
    if (!redis) return;
    try {
      const key = `${this.PREFIXES.CATEGORIES_LIST}all`;
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache categories list:', error);
    }
  }

  static async getCachedAllCategories() {
    if (!redis) return null;
    try {
      const key = `${this.PREFIXES.CATEGORIES_LIST}all`;
      const cached = await redis.get(key);
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
    } catch (error) {
      console.warn('Failed to get cached categories list:', error);
      return null;
    }
  }

  // ============== BANNER CACHING ==============

  /**
   * Cache banners by placement
   */
  static async cacheBanners(placement: string, data: any, ttl = this.TTL.BANNER) {
    if (!redis) return;
    try {
      const key = `${this.PREFIXES.BANNERS_LIST}${placement}`;
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache banners:', error);
    }
  }

  /**
   * Get cached banners by placement
   */
  static async getCachedBanners(placement: string) {
    if (!redis) return null;
    try {
      const key = `${this.PREFIXES.BANNERS_LIST}${placement}`;
      const cached = await redis.get(key);
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
    } catch (error) {
      console.warn('Failed to get cached banners:', error);
      return null;
    }
  }

  // ============== HOMEPAGE CACHING ==============

  /**
   * Cache homepage data (collections, products, etc.)
   */
  static async cacheHomepageData(key: string, data: any, ttl = this.TTL.HOMEPAGE) {
    if (!redis) return;
    try {
      const fullKey = `${this.PREFIXES.HOMEPAGE}${key}`;
      await redis.setex(fullKey, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to cache homepage data:', error);
    }
  }

  static async getCachedHomepageData(key: string) {
    if (!redis) return null;
    try {
      const fullKey = `${this.PREFIXES.HOMEPAGE}${key}`;
      const cached = await redis.get(fullKey);
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
    } catch (error) {
      console.warn('Failed to get cached homepage data:', error);
      return null;
    }
  }

  // ============== CART CACHING ==============

  /**
   * Cache user cart
   */
  static async cacheCart(userId: string, cartData: any, ttl = this.TTL.CART) {
    if (!redis) return;
    try {
      const key = `${this.PREFIXES.CART}${userId}`;
      await redis.setex(key, ttl, JSON.stringify(cartData));
    } catch (error) {
      console.warn('Failed to cache cart:', error);
    }
  }

  /**
   * Get cached cart
   */
  static async getCachedCart(userId: string) {
    if (!redis) return null;
    try {
      const key = `${this.PREFIXES.CART}${userId}`;
      const cached = await redis.get(key);
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
    } catch (error) {
      console.warn('Failed to get cached cart:', error);
      return null;
    }
  }

  /**
   * Clear cart cache
   */
  static async clearCartCache(userId: string) {
    if (!redis) return;
    try {
      const key = `${this.PREFIXES.CART}${userId}`;
      await redis.del(key);
    } catch (error) {
      console.warn('Failed to clear cart cache:', error);
    }
  }

  // ============== RATE LIMITING ==============

  /**
   * Rate limiting
   */
  static async checkRateLimit(
    identifier: string,
    limit: number,
    window: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    if (!redis) {
      return { allowed: true, remaining: limit, resetTime: Date.now() + (window * 1000) };
    }

    try {
      const key = `${this.PREFIXES.RATE_LIMIT}${identifier}`;
      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, window);
      }

      const ttl = await redis.ttl(key);
      const resetTime = Date.now() + (ttl * 1000);

      return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
        resetTime,
      };
    } catch (error) {
      console.warn('Rate limit check failed:', error);
      return { allowed: true, remaining: limit, resetTime: Date.now() + (window * 1000) };
    }
  }

  // ============== SESSION MANAGEMENT ==============

  /**
   * Store session data
   */
  static async setSession(sessionId: string, data: any, ttl = this.TTL.SESSION) {
    if (!redis) return;
    try {
      const key = `${this.PREFIXES.SESSION}${sessionId}`;
      await redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to set session:', error);
    }
  }

  /**
   * Get session data
   */
  static async getSession(sessionId: string) {
    if (!redis) return null;
    try {
      const key = `${this.PREFIXES.SESSION}${sessionId}`;
      const cached = await redis.get(key);
      return cached ? (typeof cached === 'string' ? JSON.parse(cached) : cached) : null;
    } catch (error) {
      console.warn('Failed to get session:', error);
      return null;
    }
  }

  /**
   * Clear session
   */
  static async clearSession(sessionId: string) {
    if (!redis) return;
    try {
      const key = `${this.PREFIXES.SESSION}${sessionId}`;
      await redis.del(key);
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  }

  // ============== CACHE INVALIDATION ==============

  /**
   * Bulk delete by pattern
   */
  static async clearByPattern(pattern: string) {
    if (!redis) return;
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.warn('Failed to clear by pattern:', error);
    }
  }

  /**
   * Clear all product cache
   */
  static async clearProductCache() {
    await this.clearByPattern(`${this.PREFIXES.PRODUCT}*`);
    await this.clearByPattern(`${this.PREFIXES.PRODUCTS_LIST}*`);
  }

  /**
   * Clear all collection cache
   */
  static async clearCollectionCache() {
    await this.clearByPattern(`${this.PREFIXES.COLLECTION}*`);
    await this.clearByPattern(`${this.PREFIXES.COLLECTIONS_LIST}*`);
  }

  /**
   * Clear all category cache
   */
  static async clearCategoryCache() {
    await this.clearByPattern(`${this.PREFIXES.CATEGORY}*`);
    await this.clearByPattern(`${this.PREFIXES.CATEGORIES_LIST}*`);
  }

  /**
   * Clear all banner cache
   */
  static async clearBannerCache() {
    await this.clearByPattern(`${this.PREFIXES.BANNER}*`);
    await this.clearByPattern(`${this.PREFIXES.BANNERS_LIST}*`);
  }

  /**
   * Clear homepage cache
   */
  static async clearHomepageCache() {
    await this.clearByPattern(`${this.PREFIXES.HOMEPAGE}*`);
  }

  /**
   * Clear all caches (use with caution)
   */
  static async clearAllCache() {
    await this.clearProductCache();
    await this.clearCollectionCache();
    await this.clearCategoryCache();
    await this.clearBannerCache();
    await this.clearHomepageCache();
  }
}

