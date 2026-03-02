'use server'

import { prisma } from '@/lib/db'
import { StorageDeletionService } from '@/lib/services/storage-deletion'
import { invalidateHomepageCache, invalidateAllProductCaches } from '@/lib/cache/server-cache'
import { revalidatePath } from 'next/cache'

export async function deleteProduct(id: string) {
    try {
        // Check if any variants are in orders
        const variants = await prisma.product_variants.findMany({
            where: { product_id: id },
            select: { id: true },
        })

        if (variants.length > 0) {
            const variantIds = variants.map(v => v.id)
            const orderCheck = await prisma.order_items.findFirst({
                where: { variant_id: { in: variantIds } },
                select: { id: true },
            })

            if (orderCheck) {
                return {
                    success: false,
                    error: 'Cannot delete product with existing orders. Archive it instead to hide it from your store.',
                    hasOrders: true,
                }
            }
        }

        // Cleanup images
        const productImages = await prisma.products.findUnique({
            where: { id },
            select: { product_images: true } as any,
        })

        if (productImages) {
            StorageDeletionService.deleteProductImages(productImages as any).catch(err =>
                console.error('Failed to cleanup product images:', err)
            )
        }

        await prisma.products.delete({ where: { id } })

        // Invalidate caches
        await invalidateHomepageCache()
        await invalidateAllProductCaches()

        revalidatePath('/admin/products')

        return { success: true }
    } catch (error: any) {
        console.error('Error deleting product:', error)
        if (error.code === 'P2003') {
            return {
                success: false,
                error: 'Cannot delete product with existing orders. Archive it instead to hide it from your store.',
                hasOrders: true,
            }
        }
        return { success: false, error: 'Failed to delete product' }
    }
}
