'use server'

import { prisma } from '@/lib/db'

export async function duplicateProduct(productId: string) {
    try {
        const original = await prisma.products.findUnique({
            where: { id: productId },
            include: {
                product_images: true,
                product_variants: true,
                product_categories: true,
            },
        })

        if (!original) return { success: false, error: 'Product not found' }

        const newSlug = `${original.slug}-copy-${Date.now()}`

        const newProduct = await prisma.products.create({
            data: {
                title: `${original.title} (Copy)`,
                slug: newSlug,
                description: original.description,
                price: original.price,
                compare_price: original.compare_price,
                global_stock: original.global_stock,
                status: 'draft',
                meta_title: original.meta_title,
                meta_description: original.meta_description,
                is_featured: false,
            } as any,
        })

        // Copy images
        if (original.product_images.length > 0) {
            await prisma.product_images.createMany({
                data: original.product_images.map(img => ({
                    product_id: newProduct.id,
                    image_url: img.image_url,
                    alt_text: img.alt_text,
                    is_primary: img.is_primary,
                    sort_order: img.sort_order,
                })) as any,
            })
        }

        // Copy variants
        if (original.product_variants.length > 0) {
            await prisma.product_variants.createMany({
                data: original.product_variants.map((v, i) => ({
                    product_id: newProduct.id,
                    name: v.name,
                    sku: `${v.sku}-copy-${Date.now()}-${i}`,
                    price: v.price,
                    stock: v.stock,
                    active: v.active,
                })) as any,
            })
        }

        // Copy categories
        if (original.product_categories.length > 0) {
            await prisma.product_categories.createMany({
                data: original.product_categories.map(pc => ({
                    product_id: newProduct.id,
                    category_id: pc.category_id,
                })) as any,
                skipDuplicates: true,
            })
        }

        return { success: true, data: newProduct }
    } catch (error) {
        console.error('Error duplicating product:', error)
        return { success: false, error: 'Failed to duplicate product' }
    }
}
