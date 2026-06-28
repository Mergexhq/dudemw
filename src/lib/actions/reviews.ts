'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { serializePrisma } from '@/lib/utils/prisma-utils'
import { ProductReviewWithProduct, ReviewFilters, ReviewStats, ReviewStatus } from '@/types/database/reviews'

const REVIEWS_PER_PAGE = 20

/**
 * Fetch all reviews for the admin panel with optional filters.
 * Joins the products table to get the product name and slug.
 */
export async function getAllReviews(filters: ReviewFilters = {}): Promise<{
    reviews: ProductReviewWithProduct[]
    total: number
    stats: ReviewStats
}> {
    const {
        status = 'all',
        rating = 'all',
        search = '',
        page = 1,
        limit = REVIEWS_PER_PAGE,
    } = filters

    const where: any = {}
    if (status && status !== 'all') where.status = status
    if (rating && rating !== 'all') where.rating = Number(rating)
    if (search) {
        where.reviewer_name = { contains: search, mode: 'insensitive' }
    }

    try {
        const [rawReviews, total, statsRaw] = await Promise.all([
            prisma.product_reviews.findMany({
                where,
                orderBy: { created_at: 'desc' } as any,
                skip: (page - 1) * limit,
                take: limit,
            }) as any,
            prisma.product_reviews.count({ where }) as any,
            prisma.product_reviews.groupBy({
                by: ['status'] as any,
                _count: { id: true } as any,
                _avg: { rating: true } as any,
            }) as any,
        ])

        // Attach product info
        const productIds = [...new Set(rawReviews.map((r: any) => r.product_id))]
        const products = productIds.length
            ? await (prisma.products.findMany({
                where: { id: { in: productIds } } as any,
                select: { id: true, title: true, url_handle: true } as any,
            }) as any)
            : []
        const productMap = Object.fromEntries(products.map((p: any) => [p.id, p]))

        const reviews: ProductReviewWithProduct[] = serializePrisma(
            rawReviews.map((r: any) => ({
                ...r,
                product_name: productMap[r.product_id]?.title ?? null,
                product_slug: productMap[r.product_id]?.url_handle ?? null,
            }))
        )

        // Build stats
        const pending = statsRaw.find((s: any) => s.status === 'pending')?._count?.id ?? 0
        const approved = statsRaw.find((s: any) => s.status === 'approved')?._count?.id ?? 0
        const rejected = statsRaw.find((s: any) => s.status === 'rejected')?._count?.id ?? 0
        const totalAll = pending + approved + rejected

        // Average rating across all reviews
        const avgResult = await prisma.product_reviews.aggregate({
            _avg: { rating: true } as any,
        }) as any
        const average_rating = Math.round((avgResult._avg?.rating ?? 0) * 10) / 10

        // Featured count
        const featured = await prisma.product_reviews.count({
            where: { is_featured: true } as any,
        }) as any

        const stats: ReviewStats = {
            total: totalAll,
            pending,
            approved,
            rejected,
            featured,
            average_rating,
        }

        return { reviews, total, stats }
    } catch (err) {
        console.error('getAllReviews error:', err)
        throw new Error('Failed to fetch reviews')
    }
}

/**
 * Get a single review by ID with product info.
 */
export async function getReviewById(id: string): Promise<ProductReviewWithProduct | null> {
    try {
        const review = await prisma.product_reviews.findUnique({
            where: { id } as any,
        }) as any
        if (!review) return null

        const product = await prisma.products.findUnique({
            where: { id: review.product_id } as any,
            select: { id: true, title: true, url_handle: true } as any,
        }) as any

        return serializePrisma({
            ...review,
            product_name: product?.title ?? null,
            product_slug: product?.url_handle ?? null,
        }) as ProductReviewWithProduct
    } catch (err) {
        console.error('getReviewById error:', err)
        return null
    }
}

/**
 * Update a review's status (approve / reject / pending).
 */
export async function updateReviewStatus(id: string, status: ReviewStatus) {
    await prisma.product_reviews.update({
        where: { id } as any,
        data: { status, updated_at: new Date() } as any,
    })
    revalidatePath('/admin/reviews')
    revalidatePath('/(store)', 'layout')
    return { success: true }
}

/**
 * Toggle the featured pin on a review.
 */
export async function toggleReviewFeatured(id: string, is_featured: boolean) {
    await prisma.product_reviews.update({
        where: { id } as any,
        data: { is_featured, updated_at: new Date() } as any,
    })
    revalidatePath('/admin/reviews')
    revalidatePath('/(store)', 'layout')
    return { success: true }
}

/**
 * Save or clear the admin's reply on a review.
 */
export async function updateAdminReply(id: string, admin_reply: string | null) {
    await prisma.product_reviews.update({
        where: { id } as any,
        data: { admin_reply: admin_reply || null, updated_at: new Date() } as any,
    })
    revalidatePath('/admin/reviews')
    revalidatePath('/(store)', 'layout')
    return { success: true }
}

/**
 * Permanently delete a single review.
 */
export async function deleteReview(id: string) {
    await prisma.product_reviews.delete({ where: { id } as any })
    revalidatePath('/admin/reviews')
    revalidatePath('/(store)', 'layout')
    return { success: true }
}

/**
 * Bulk action: approve / reject / delete / feature / unfeature multiple reviews.
 */
export async function bulkUpdateReviews(ids: string[], action: 'approve' | 'reject' | 'delete' | 'feature' | 'unfeature') {
    if (!ids.length) return { success: true }

    switch (action) {
        case 'approve':
            await prisma.product_reviews.updateMany({
                where: { id: { in: ids } } as any,
                data: { status: 'approved', updated_at: new Date() } as any,
            })
            break
        case 'reject':
            await prisma.product_reviews.updateMany({
                where: { id: { in: ids } } as any,
                data: { status: 'rejected', updated_at: new Date() } as any,
            })
            break
        case 'delete':
            await prisma.product_reviews.deleteMany({ where: { id: { in: ids } } as any })
            break
        case 'feature':
            await prisma.product_reviews.updateMany({
                where: { id: { in: ids } } as any,
                data: { is_featured: true, updated_at: new Date() } as any,
            })
            break
        case 'unfeature':
            await prisma.product_reviews.updateMany({
                where: { id: { in: ids } } as any,
                data: { is_featured: false, updated_at: new Date() } as any,
            })
            break
    }

    revalidatePath('/admin/reviews')
    revalidatePath('/(store)', 'layout')
    return { success: true }
}
