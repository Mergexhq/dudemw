'use server'

import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

async function getCurrentUserId(): Promise<string | null> {
    try {
        const { userId } = await auth()
        return userId || null
    } catch {
        return null
    }
}

export async function addToWishlist(productId: string): Promise<{ success: boolean; error?: string }> {
    console.log('[addToWishlist] Called with productId:', productId)
    try {
        const userId = await getCurrentUserId()
        if (!userId) return { success: false, error: 'Not authenticated' }

        await prisma.wishlists.upsert({
            where: { user_id_product_id: { user_id: userId, product_id: productId } } as any,
            create: { user_id: userId, product_id: productId } as any,
            update: {},
        })

        revalidatePath('/wishlist')
        return { success: true }
    } catch (error: any) {
        console.error('[addToWishlist] Exception:', error)
        return { success: false, error: error.message || 'Failed to add to wishlist' }
    }
}

export async function removeFromWishlist(productId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId()
        if (!userId) return { success: false, error: 'Not authenticated' }

        await prisma.wishlists.deleteMany({
            where: { user_id: userId, product_id: productId } as any,
        })

        revalidatePath('/wishlist')
        return { success: true }
    } catch (error: any) {
        console.error('[removeFromWishlist] Exception:', error)
        return { success: false, error: error.message || 'Failed to remove from wishlist' }
    }
}

export async function getWishlistIds(): Promise<{ success: boolean; productIds?: string[]; error?: string }> {
    try {
        const userId = await getCurrentUserId()
        if (!userId) return { success: true, productIds: [] }

        const items = await prisma.wishlists.findMany({
            where: { user_id: userId } as any,
            select: { product_id: true },
            orderBy: { created_at: 'desc' } as any,
        })

        const productIds = items.map((w: any) => w.product_id)
        return { success: true, productIds }
    } catch (error: any) {
        console.error('Error fetching wishlist:', error)
        return { success: false, error: error.message || 'Failed to fetch wishlist' }
    }
}

export async function getWishlistWithProducts(): Promise<{ success: boolean; products?: any[]; error?: string }> {
    try {
        const userId = await getCurrentUserId()
        if (!userId) return { success: true, products: [] }

        const items = await prisma.wishlists.findMany({
            where: { user_id: userId } as any,
            orderBy: { created_at: 'desc' } as any,
            include: {
                products: {
                    select: {
                        id: true, title: true, slug: true, price: true, compare_price: true,
                        product_images: { select: { image_url: true, is_primary: true } },
                    },
                },
            },
        })

        const products = (items as any[]).map(w => {
            const product = w.products
            if (!product) return null
            const primaryImage = product.product_images?.find((img: any) => img.is_primary)
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
    } catch (error: any) {
        console.error('[getWishlistWithProducts] Exception:', error)
        return { success: false, error: error.message || 'Failed to fetch wishlist' }
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

        const products = (data as any[]).map(product => {
            const primaryImage = product.product_images?.find((img: any) => img.is_primary)
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
    } catch (error: any) {
        console.error('[getProductsByIds] Exception:', error)
        return { success: false, error: error.message || 'Failed to fetch products' }
    }
}

export async function mergeGuestWishlist(guestProductIds: string[]): Promise<{ success: boolean; mergedCount?: number; error?: string }> {
    try {
        const userId = await getCurrentUserId()
        if (!userId) return { success: false, error: 'Not authenticated' }
        if (!guestProductIds || guestProductIds.length === 0) return { success: true, mergedCount: 0 }

        const existing = await prisma.wishlists.findMany({
            where: { user_id: userId } as any,
            select: { product_id: true },
        })
        const existingIds = new Set((existing as any[]).map(w => w.product_id))
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
                    data: validToInsert.map(productId => ({ user_id: userId, product_id: productId } as any)),
                    skipDuplicates: true,
                })
            }
        }

        revalidatePath('/wishlist')
        return { success: true, mergedCount: toInsert.length }
    } catch (error: any) {
        console.error('Error merging wishlist:', error)
        return { success: false, error: error.message || 'Failed to merge wishlist' }
    }
}

export async function clearWishlist(): Promise<{ success: boolean; error?: string }> {
    try {
        const userId = await getCurrentUserId()
        if (!userId) return { success: false, error: 'Not authenticated' }

        await prisma.wishlists.deleteMany({ where: { user_id: userId } as any })
        revalidatePath('/wishlist')
        return { success: true }
    } catch (error: any) {
        console.error('Error clearing wishlist:', error)
        return { success: false, error: error.message || 'Failed to clear wishlist' }
    }
}
