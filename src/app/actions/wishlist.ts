'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'
import { getOrCreateCustomerForUser } from '@/lib/actions/customer-domain'

/**
 * Get the customer UUID for the currently logged-in Clerk user.
 * Returns null for admins or if mapping fails.
 */
async function getCurrentCustomerId(): Promise<string | null> {
    try {
        const { userId: clerkId } = await auth()
        if (!clerkId) return null

        // Map the Clerk user ID to our database Customer UUID
        const result = await getOrCreateCustomerForUser(clerkId)
        if (result.success && result.data) {
            return result.data.id // This is a proper UUID from the customers table
        }

        return null
    } catch {
        return null
    }
}

export async function addToWishlist(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const customerId = await getCurrentCustomerId()
        if (!customerId) return { success: false, error: 'Not authenticated or user mapping failed' }

        // Check if already exists, then create if not
        const existing = await prisma.wishlists.findFirst({
            where: { user_id: customerId, product_id: productId },
        })

        if (!existing) {
            await prisma.wishlists.create({
                data: { user_id: customerId, product_id: productId },
            })
        }

        revalidatePath('/wishlist')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to add to wishlist'
        console.error('[addToWishlist] Exception:', message)
        return { success: false, error: message }
    }
}

export async function removeFromWishlist(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const customerId = await getCurrentCustomerId()
        if (!customerId) return { success: false, error: 'Not authenticated or user mapping failed' }

        await prisma.wishlists.deleteMany({
            where: { user_id: customerId, product_id: productId },
        })

        revalidatePath('/wishlist')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to remove from wishlist'
        console.error('[removeFromWishlist] Exception:', message)
        return { success: false, error: message }
    }
}

export async function getWishlistIds(): Promise<{ success: boolean; productIds?: string[]; error?: string }> {
    try {
        const customerId = await getCurrentCustomerId()
        if (!customerId) return { success: true, productIds: [] }

        const items = await prisma.wishlists.findMany({
            where: { user_id: customerId },
            select: { product_id: true },
            orderBy: { created_at: 'desc' },
        })

        const productIds = items.map((w) => w.product_id)
        return { success: true, productIds }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch wishlist'
        console.error('Error fetching wishlist:', message)
        return { success: false, error: message }
    }
}

export async function getWishlistWithProducts(): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
        const customerId = await getCurrentCustomerId()
        if (!customerId) return { success: true, products: [] }

        const items = await prisma.wishlists.findMany({
            where: { user_id: customerId },
            orderBy: { created_at: 'desc' },
            include: {
                products: {
                    select: {
                        id: true, title: true, slug: true, price: true, compare_price: true,
                        product_images: { select: { image_url: true, is_primary: true } },
                    },
                },
            },
        })

        const products = items.map(w => {
            const product = w.products
            if (!product) return null
            const primaryImage = product.product_images?.find((img) => img.is_primary)
            const firstImage = product.product_images?.[0]
            return {
                id: product.id,
                title: product.title,
                slug: product.slug,
                price: product.price,
                comparePrice: product.compare_price,
                image: primaryImage?.image_url || firstImage?.image_url || '/images/placeholder-product.jpg',
                addedAt: w.created_at,
            }
        }).filter(Boolean)

        return { success: true, products }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch wishlist'
        console.error('[getWishlistWithProducts] Exception:', message)
        return { success: false, error: message }
    }
}

export async function getProductsByIds(productIds: string[]): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
        if (!productIds || productIds.length === 0) return { success: true, products: [] }

        const data = await prisma.products.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true, title: true, slug: true, price: true, compare_price: true,
                product_images: { select: { image_url: true, is_primary: true } },
            },
        })

        const products = data.map(product => {
            const primaryImage = product.product_images?.find((img) => img.is_primary)
            const firstImage = product.product_images?.[0]
            return {
                id: product.id,
                title: product.title,
                slug: product.slug,
                price: product.price,
                comparePrice: product.compare_price,
                image: primaryImage?.image_url || firstImage?.image_url || '/images/placeholder-product.jpg',
            }
        })

        return { success: true, products }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to fetch products'
        console.error('[getProductsByIds] Exception:', message)
        return { success: false, error: message }
    }
}

export async function mergeGuestWishlist(guestProductIds: string[]): Promise<{ success: boolean; mergedCount?: number; error?: string }> {
    try {
        const customerId = await getCurrentCustomerId()
        if (!customerId) return { success: false, error: 'Not authenticated or user mapping failed' }
        if (!guestProductIds || guestProductIds.length === 0) return { success: true, mergedCount: 0 }

        const existing = await prisma.wishlists.findMany({
            where: { user_id: customerId },
            select: { product_id: true },
        })
        const existingIds = new Set(existing.map(w => w.product_id))
        const toInsert = guestProductIds.filter(id => !existingIds.has(id))

        if (toInsert.length > 0) {
            const validProducts = await prisma.products.findMany({
                where: { id: { in: toInsert } },
                select: { id: true },
            })
            const validIds = new Set(validProducts.map(p => p.id))
            const validToInsert = toInsert.filter(id => validIds.has(id))

            if (validToInsert.length > 0) {
                await prisma.wishlists.createMany({
                    data: validToInsert.map(productId => ({ user_id: customerId, product_id: productId })),
                    skipDuplicates: true,
                })
            }
        }

        revalidatePath('/wishlist')
        return { success: true, mergedCount: toInsert.length }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to merge wishlist'
        console.error('Error merging wishlist:', message)
        return { success: false, error: message }
    }
}

export async function clearWishlist(): Promise<{ success: boolean; error?: string }> {
    try {
        const customerId = await getCurrentCustomerId()
        if (!customerId) return { success: false, error: 'Not authenticated or user mapping failed' }

        await prisma.wishlists.deleteMany({ where: { user_id: customerId } })
        revalidatePath('/wishlist')
        return { success: true }
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to clear wishlist'
        console.error('Error clearing wishlist:', message)
        return { success: false, error: message }
    }
}
