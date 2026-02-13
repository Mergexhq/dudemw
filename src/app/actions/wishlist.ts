'use server'

import { supabaseAdmin } from '@/lib/supabase/supabase'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

// Get the current user's ID from the session (server-side)
async function getCurrentUserId(): Promise<string | null> {
    try {
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        const { data: { user }, error } = await supabase.auth.getUser()
        if (error) {
            console.error('[getCurrentUserId] Auth error:', error)
            return null
        }

        return user?.id || null
    } catch (error) {
        console.error('[getCurrentUserId] Exception:', error)
        return null
    }
}

/**
 * Add a product to the user's wishlist
 * Idempotent - ignores duplicates
 */
export async function addToWishlist(productId: string): Promise<{ success: boolean; error?: string }> {
    console.log('[addToWishlist] Called with productId:', productId)

    try {
        const userId = await getCurrentUserId()
        console.log('[addToWishlist] User ID:', userId)

        if (!userId) {
            console.warn('[addToWishlist] Not authenticated')
            return { success: false, error: 'Not authenticated' }
        }

        console.log('[addToWishlist] Attempting to insert:', { user_id: userId, product_id: productId })

        // Use upsert to handle duplicates gracefully (idempotent)
        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .upsert(
                { user_id: userId, product_id: productId },
                { onConflict: 'user_id,product_id', ignoreDuplicates: true }
            )
            .select()

        if (error) {
            console.error('[addToWishlist] Supabase error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            })
            throw error
        }

        console.log('[addToWishlist] Success! Inserted/updated:', data)
        revalidatePath('/wishlist')
        return { success: true }
    } catch (error: any) {
        console.error('[addToWishlist] Exception:', {
            message: error.message,
            stack: error.stack,
            full: error
        })
        return { success: false, error: error.message || 'Failed to add to wishlist' }
    }
}

/**
 * Remove a product from the user's wishlist
 */
export async function removeFromWishlist(productId: string): Promise<{ success: boolean; error?: string }> {
    console.log('[removeFromWishlist] Called with productId:', productId)

    try {
        const userId = await getCurrentUserId()
        console.log('[removeFromWishlist] User ID:', userId)

        if (!userId) {
            return { success: false, error: 'Not authenticated' }
        }

        const { error } = await supabaseAdmin
            .from('wishlists')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', productId)

        if (error) {
            console.error('[removeFromWishlist] Error:', error)
            throw error
        }

        console.log('[removeFromWishlist] Success')
        revalidatePath('/wishlist')
        return { success: true }
    } catch (error: any) {
        console.error('[removeFromWishlist] Exception:', error)
        return { success: false, error: error.message || 'Failed to remove from wishlist' }
    }
}

/**
 * Get all wishlisted product IDs for the current user
 * Returns flat array of product IDs for O(1) Set-based lookups
 */
export async function getWishlistIds(): Promise<{ success: boolean; productIds?: string[]; error?: string }> {
    try {
        const userId = await getCurrentUserId()
        if (!userId) {
            return { success: true, productIds: [] } // Return empty for guests
        }

        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .select('product_id')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) throw error

        const productIds = data?.map(w => w.product_id) || []
        return { success: true, productIds }
    } catch (error: any) {
        console.error('Error fetching wishlist:', error)
        return { success: false, error: error.message || 'Failed to fetch wishlist' }
    }
}

/**
 * Get full wishlist with product details for display
 */
export async function getWishlistWithProducts(): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
        const userId = await getCurrentUserId()

        if (!userId) {
            return { success: true, products: [] }
        }

        const { data, error } = await supabaseAdmin
            .from('wishlists')
            .select(`
        product_id,
        created_at,
        products (
          id,
          title,
          slug,
          price,
          compare_price,
          product_images (image_url, is_primary)
        )
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[getWishlistWithProducts] Query error:', error)
            throw error
        }

        // Transform to flat product array
        const products = data?.map(w => {
            const product = (w as any).products
            if (!product) {
                return null
            }

            const primaryImage = product.product_images?.find((img: any) => img.is_primary)
            const firstImage = product.product_images?.[0]

            return {
                id: product.id,
                title: product.title,
                slug: product.slug,
                price: product.price,
                comparePrice: product.compare_price,
                image: primaryImage?.image_url || firstImage?.image_url || '/images/placeholder-product.jpg',
                addedAt: w.created_at
            }
        }).filter(Boolean) || []

        return { success: true, products }
    } catch (error: any) {
        console.error('[getWishlistWithProducts] Exception:', error)
        return { success: false, error: error.message || 'Failed to fetch wishlist' }
    }
}

/**
 * Get product details by product IDs (for guest wishlist)
 * This doesn't require authentication
 */
export async function getProductsByIds(productIds: string[]): Promise<{ success: boolean; products?: any[]; error?: string }> {
    console.log('[getProductsByIds] Called with', productIds.length, 'IDs')

    try {
        if (!productIds || productIds.length === 0) {
            console.log('[getProductsByIds] No product IDs provided')
            return { success: true, products: [] }
        }

        const { data, error } = await supabaseAdmin
            .from('products')
            .select(`
        id,
        title,
        slug,
        price,
        compare_price,
        product_images (image_url, is_primary)
      `)
            .in('id', productIds)

        if (error) {
            console.error('[getProductsByIds] Query error:', error)
            throw error
        }

        console.log('[getProductsByIds] Raw data:', data)

        // Transform to consistent format
        const products = data?.map(product => {
            const primaryImage = (product as any).product_images?.find((img: any) => img.is_primary)
            const firstImage = (product as any).product_images?.[0]

            return {
                id: product.id,
                title: product.title,
                slug: product.slug,
                price: product.price,
                comparePrice: product.compare_price,
                image: primaryImage?.image_url || firstImage?.image_url || '/images/placeholder-product.jpg',
            }
        }) || []

        console.log('[getProductsByIds] Transformed products:', products)
        return { success: true, products }
    } catch (error: any) {
        console.error('[getProductsByIds] Exception:', error)
        return { success: false, error: error.message || 'Failed to fetch products' }
    }
}


/**
 * Merge guest wishlist (localStorage) with user wishlist on login
 * Strategy: Union both sets, insert missing items to DB
 */
export async function mergeGuestWishlist(guestProductIds: string[]): Promise<{ success: boolean; mergedCount?: number; error?: string }> {
    try {
        const userId = await getCurrentUserId()
        if (!userId) {
            return { success: false, error: 'Not authenticated' }
        }

        if (!guestProductIds || guestProductIds.length === 0) {
            return { success: true, mergedCount: 0 }
        }

        // Get existing user wishlist
        const { data: existing } = await supabaseAdmin
            .from('wishlists')
            .select('product_id')
            .eq('user_id', userId)

        const existingIds = new Set(existing?.map(w => w.product_id) || [])

        // Find items to insert (in guest but not in DB)
        const toInsert = guestProductIds.filter(id => !existingIds.has(id))

        if (toInsert.length > 0) {
            // Validate that products exist before inserting
            const { data: validProducts } = await supabaseAdmin
                .from('products')
                .select('id')
                .in('id', toInsert)

            const validIds = new Set(validProducts?.map(p => p.id) || [])
            const validToInsert = toInsert.filter(id => validIds.has(id))

            if (validToInsert.length > 0) {
                const insertData = validToInsert.map(productId => ({
                    user_id: userId,
                    product_id: productId
                }))

                await supabaseAdmin
                    .from('wishlists')
                    .upsert(insertData, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
            }
        }

        revalidatePath('/wishlist')
        return { success: true, mergedCount: toInsert.length }
    } catch (error: any) {
        console.error('Error merging wishlist:', error)
        return { success: false, error: error.message || 'Failed to merge wishlist' }
    }
}

/**
 * Clear all items from user's wishlist
 */
export async function clearWishlist(): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId()
        if (!userId) {
            return { success: false, error: 'Not authenticated' }
        }

        const { error } = await supabaseAdmin
            .from('wishlists')
            .delete()
            .eq('user_id', userId)

        if (error) throw error

        revalidatePath('/wishlist')
        return { success: true }
    } catch (error: any) {
        console.error('Error clearing wishlist:', error)
        return { success: false, error: error.message || 'Failed to clear wishlist' }
    }
}
