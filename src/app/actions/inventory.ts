'use server'

import prisma from '@/lib/db'

export async function getInventoryItemById(id: string) {
    try {
        const item = await prisma.inventory_items.findUnique({
            where: { id },
            include: {
                product_variants: {
                    include: {
                        product: {
                            include: {
                                product_images: {
                                    where: { is_primary: true },
                                    take: 1
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!item) {
            return { success: false, error: 'Inventory item not found' }
        }

        // Map it to match the existing front-end structure if possible,
        // or just return and handle mapping in the frontend.
        // The structure expected:
        // {
        //   ...item,
        //   products: { id, title, slug, price, product_images: [] },
        //   product_variants: { id, name, sku, price }
        // }

        const product = item.product_variants?.product;

        const mappedItem = {
            id: item.id,
            product_id: item.product_variants?.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity || 0,
            reserved_quantity: item.reserved_quantity || 0,
            track_quantity: item.track_quantity ?? true,
            allow_backorder: item.allow_backorders ?? false,
            low_stock_threshold: item.low_stock_threshold || 10,
            created_at: item.created_at,
            updated_at: item.updated_at,
            products: product ? {
                id: product.id,
                title: product.title,
                slug: product.slug,
                price: parseFloat(product.price?.toString() || '0'),
                product_images: product.product_images || []
            } : null,
            product_variants: item.product_variants ? {
                id: item.product_variants.id,
                name: item.product_variants.name,
                sku: item.product_variants.sku,
                price: parseFloat(item.product_variants.price?.toString() || '0')
            } : null
        }

        return { success: true, data: mappedItem }
    } catch (error: any) {
        console.error('Error fetching inventory item:', error)
        return { success: false, error: 'Failed to fetch inventory item' }
    }
}

export async function adjustInventoryQuantity(id: string, newQuantity: number) {
    try {
        const updated = await prisma.inventory_items.update({
            where: { id },
            data: {
                quantity: newQuantity,
                updated_at: new Date()
            }
        })

        return { success: true, data: updated }
    } catch (error: any) {
        console.error('Error adjusting inventory:', error)
        return { success: false, error: 'Failed to adjust stock' }
    }
}

export async function updateInventorySettings(id: string, settings: {
    track_quantity: boolean,
    allow_backorder: boolean,
    low_stock_threshold: number
}) {
    try {
        const updated = await prisma.inventory_items.update({
            where: { id },
            data: {
                track_quantity: settings.track_quantity,
                allow_backorders: settings.allow_backorder,
                low_stock_threshold: settings.low_stock_threshold,
                updated_at: new Date()
            }
        })
        return { success: true, data: updated }
    } catch (error: any) {
        console.error('Error updating inventory settings:', error)
        return { success: false, error: 'Failed to update settings' }
    }
}
