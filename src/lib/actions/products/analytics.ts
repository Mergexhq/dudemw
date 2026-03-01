'use server'

import { prisma } from '@/lib/db'

/** Track product view */
export async function trackView(productId: string) {
    try {
        await prisma.product_analytics.upsert({
            where: { product_id: productId },
            update: {
                view_count: { increment: 1 },
                last_viewed_at: new Date(),
            },
            create: {
                product_id: productId,
                view_count: 1,
                add_to_cart_count: 0,
                purchase_count: 0,
                total_revenue: 0,
                last_viewed_at: new Date(),
            } as any,
        })
        return { success: true }
    } catch (error) {
        console.error('Error tracking view:', error)
        return { success: false }
    }
}

/** Track add to cart */
export async function trackAddToCart(productId: string) {
    try {
        await prisma.product_analytics.upsert({
            where: { product_id: productId },
            update: { add_to_cart_count: { increment: 1 } },
            create: {
                product_id: productId,
                view_count: 0,
                add_to_cart_count: 1,
                purchase_count: 0,
                total_revenue: 0,
            } as any,
        })
        return { success: true }
    } catch (error) {
        console.error('Error tracking add to cart:', error)
        return { success: false }
    }
}

/** Get product analytics */
export async function getProductAnalytics(productId: string) {
    try {
        const analytics = await prisma.product_analytics.findUnique({ where: { product_id: productId } })

        const data = analytics || {
            product_id: productId,
            view_count: 0,
            add_to_cart_count: 0,
            purchase_count: 0,
            total_revenue: 0,
            conversion_rate: 0,
        }

        const viewCount = Number(data.view_count || 0)
        const purchaseCount = Number(data.purchase_count || 0)
        const conversionRate = viewCount > 0 ? (purchaseCount / viewCount) * 100 : 0

        return { success: true, data: { ...data, conversion_rate: conversionRate } }
    } catch (error) {
        console.error('Error fetching product analytics:', error)
        return { success: false, error: 'Failed to fetch analytics' }
    }
}
