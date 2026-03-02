'use server'

import { prisma } from '@/lib/db'

export interface ProductSEO {
    meta_title?: string
    meta_description?: string
    keywords?: string[]
    og_image?: string
    seo_score?: number
}

/** Update product SEO */
export async function updateProductSEO(productId: string, seo: ProductSEO) {
    try {
        await prisma.products.update({
            where: { id: productId },
            data: {
                meta_title: seo.meta_title,
                meta_description: seo.meta_description,
                updated_at: new Date(),
            } as any,
        })
        return { success: true }
    } catch (error) {
        console.error('Error updating product SEO:', error)
        return { success: false, error: 'Failed to update SEO' }
    }
}
