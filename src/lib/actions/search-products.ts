'use server'

import { prisma } from '@/lib/db'

export interface ProductSearchResult {
    id: string
    title: string
    slug: string | null
    product_family_id: string | null
}

export async function searchProducts(
    query: string,
    excludeProductId?: string
): Promise<{ success: boolean; data?: ProductSearchResult[]; error?: string }> {
    try {
        if (!query || query.trim().length === 0) return { success: true, data: [] }

        const data = await prisma.products.findMany({
            where: {
                status: 'published',
                title: { contains: query.trim(), mode: 'insensitive' } as any,
                ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
            } as any,
            select: { id: true, title: true, slug: true, product_family_id: true } as any,
            orderBy: { title: 'asc' } as any,
            take: 50,
        }) as any[]

        return { success: true, data }
    } catch (error) {
        console.error('Error in searchProducts:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}
