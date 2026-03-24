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

        // Manual 1-by-1 cascade to avoid Prisma P2003 when no orders exist
        await prisma.$transaction(async (tx) => {
            // 1. Delete deeply nested variant dependencies
            if (variants.length > 0) {
                const variantIds = variants.map(v => v.id)
                await tx.cart_items.deleteMany({ where: { variant_id: { in: variantIds } } })
                await tx.inventory_logs.deleteMany({ where: { variant_id: { in: variantIds } } })
                await tx.inventory_items.deleteMany({ where: { variant_id: { in: variantIds } } })
                await tx.variant_images.deleteMany({ where: { variant_id: { in: variantIds } } })
                await tx.variant_option_values.deleteMany({ where: { variant_id: { in: variantIds } } })
                await tx.variant_prices.deleteMany({ where: { variant_id: { in: variantIds } } })
                await tx.supplier_products.deleteMany({ where: { variant_id: { in: variantIds } } })
                await tx.low_stock_notifications.deleteMany({ where: { variant_id: { in: variantIds } } })
                
                await tx.product_variants.deleteMany({ where: { product_id: id } })
            }
            
            // 2. Delete deeply nested product options
            const options = await tx.product_options.findMany({ where: { product_id: id }, select: { id: true } })
            if (options.length > 0) {
                const optIds = options.map(o => o.id)
                await tx.product_option_values.deleteMany({ where: { option_id: { in: optIds } } })
                await tx.product_options.deleteMany({ where: { product_id: id } })
            }
            
            // 3. Delete direct product dependencies
            await tx.product_categories.deleteMany({ where: { product_id: id } })
            await tx.product_collections.deleteMany({ where: { product_id: id } })
            await tx.product_images.deleteMany({ where: { product_id: id } })
            await tx.product_analytics.deleteMany({ where: { product_id: id } })
            await tx.product_tag_assignments.deleteMany({ where: { product_id: id } })
            await tx.product_tax_rules.deleteMany({ where: { product_id: id } })
            await tx.low_stock_notifications.deleteMany({ where: { product_id: id } })
            await tx.product_reviews.deleteMany({ where: { product_id: id } })
            await tx.supplier_products.deleteMany({ where: { product_id: id } })
            await tx.wishlists.deleteMany({ where: { product_id: id } })
            
            // 4. Finally delete the product
            await tx.products.delete({ where: { id } })
        })

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
