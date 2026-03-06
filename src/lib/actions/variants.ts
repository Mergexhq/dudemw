'use server'

import { prisma } from '@/lib/db'
import { serializePrisma } from '@/lib/utils/prisma-utils'

export async function checkSkuExistsAction(sku: string) {
    try {
        const existing = await prisma.product_variants.findFirst({
            where: { sku },
            select: { id: true }
        })
        return { success: true, exists: !!existing }
    } catch (error) {
        console.error('Error checking SKU:', error)
        return { success: false, error: 'Failed to check SKU' }
    }
}

export async function createVariantAction(data: {
    product_id: string
    name: string
    sku: string
    price: number
    compare_price?: string | null
    stock: number
    active: boolean
    color_option_id?: string
    size_option_id?: string
}) {
    try {
        const variant = await prisma.product_variants.create({
            data: {
                product_id: data.product_id,
                name: data.name,
                sku: data.sku,
                price: data.price,
                discount_price: data.compare_price ? parseFloat(data.compare_price) : null,
                stock: data.stock,
                active: data.active,
            }
        })

        // Create variant option values
        const optionValues: { variant_id: string; option_value_id: string }[] = []
        if (data.color_option_id) {
            optionValues.push({ variant_id: variant.id, option_value_id: data.color_option_id })
        }
        if (data.size_option_id) {
            optionValues.push({ variant_id: variant.id, option_value_id: data.size_option_id })
        }

        if (optionValues.length > 0) {
            await prisma.variant_option_values.createMany({ data: optionValues })
        }

        await prisma.inventory_items.create({
            data: {
                variant_id: variant.id,
                sku: variant.sku,
                quantity: data.stock,
                track_quantity: true,
            } as any
        })

        return { success: true, data: serializePrisma(variant) }
    } catch (error) {
        console.error('Error creating variant:', error)
        return { success: false, error: 'Failed to create variant' }
    }
}

export async function saveVariantImageAction(variantId: string, imageUrl: string, altText: string, position: number) {
    try {
        await prisma.variant_images.create({
            data: {
                variant_id: variantId,
                image_url: imageUrl,
                alt_text: altText,
                position
            }
        })
        return { success: true }
    } catch (error) {
        console.error('Error saving variant image:', error)
        return { success: false, error: 'Failed to save variant image' }
    }
}

export async function updateVariantAction(id: string, data: {
    name: string
    sku: string
    price: number
    discount_price?: number | null
    stock: number
    active: boolean
}) {
    try {
        await prisma.product_variants.update({
            where: { id },
            data: {
                name: data.name,
                sku: data.sku,
                price: data.price,
                discount_price: data.discount_price,
                stock: data.stock,
                active: data.active,
            }
        })

        await prisma.inventory_items.updateMany({
            where: { variant_id: id },
            data: {
                sku: data.sku,
                quantity: data.stock
            } as any
        })
        return { success: true }
    } catch (error) {
        console.error('Error updating variant:', error)
        return { success: false, error: 'Failed to update variant' }
    }
}

export async function deleteVariantImageAction(imageId: string) {
    try {
        await prisma.variant_images.delete({ where: { id: imageId } })
        return { success: true }
    } catch (error) {
        console.error('Error deleting variant image:', error)
        return { success: false, error: 'Failed to delete variant image' }
    }
}
