'use server'

import { prisma } from '@/lib/db'
import { invalidateHomepageCache, invalidateAllProductCaches, invalidateProductCache } from '@/lib/cache/server-cache'
import { revalidatePath } from 'next/cache'

// A subset of ProductUpdate for Prisma
export type ProductUpdate = any // Defining explicitly if needed

export async function updateProduct(id: string, updates: any & {
    categoryIds?: string[]
    collectionIds?: string[]
    tags?: string[]
    images?: { url: string; alt: string; isPrimary: boolean; id?: string }[]
    default_variant_id?: string | null
    highlights?: string[]
    product_family_id?: string | null
}) {
    try {
        const { categoryIds, collectionIds, tags, images, default_variant_id, highlights, product_family_id, ...productFields } = updates

        const updateData: any = {
            ...productFields,
            default_variant_id,
        }

        if (highlights !== undefined) updateData.highlights = highlights
        if (product_family_id !== undefined) updateData.product_family_id = product_family_id

        let product = await prisma.products.update({
            where: { id },
            data: updateData
        })

        const isExplicitPriceUpdate = 'price' in productFields || 'compare_price' in productFields

        if (!isExplicitPriceUpdate) {
            const variantsCount = await prisma.product_variants.count({ where: { product_id: id } })

            if (variantsCount > 0) {
                const variants = await prisma.product_variants.findMany({
                    where: { product_id: id, active: true },
                    select: { price: true, discount_price: true, stock: true }
                })

                if (variants && variants.length > 0) {
                    const prices = variants.map(v => Number(v.price)).filter(p => !isNaN(p) && p > 0)
                    const comparePrices = variants.map(v => Number(v.discount_price)).filter(p => !isNaN(p) && p > 0)
                    const totalStock = variants.reduce((acc, v) => acc + (v.stock || 0), 0)

                    const autoUpdates: any = { global_stock: totalStock }
                    if (prices.length > 0) autoUpdates.price = Math.min(...prices)
                    if (comparePrices.length > 0) autoUpdates.compare_price = Math.min(...comparePrices)

                    product = await prisma.products.update({
                        where: { id },
                        data: autoUpdates
                    })
                }
            }
        }

        if (categoryIds !== undefined) {
            await prisma.product_categories.deleteMany({ where: { product_id: id } })
            if (categoryIds.length > 0) {
                await prisma.product_categories.createMany({
                    data: categoryIds.map((categoryId: string) => ({
                        product_id: id,
                        category_id: categoryId
                    }))
                })
            }
        }

        if (collectionIds !== undefined) {
            await prisma.product_collections.deleteMany({ where: { product_id: id } })
            if (collectionIds.length > 0) {
                await prisma.product_collections.createMany({
                    data: collectionIds.map((collectionId: string, index: number) => ({
                        product_id: id,
                        collection_id: collectionId,
                        position: index
                    }))
                })
            }
        }

        if (images) {
            await prisma.product_images.deleteMany({ where: { product_id: id } })

            if (images.length > 0) {
                await prisma.product_images.createMany({
                    data: images.map((img, index) => ({
                        product_id: id,
                        image_url: img.url,
                        alt_text: img.alt || productFields.title || 'Product Image',
                        is_primary: img.isPrimary,
                        sort_order: index
                    }))
                })
            }
        }

        revalidatePath('/admin/products')
        revalidatePath(`/admin/products/${id}`)

        let slug = productFields.slug || productFields.url_handle
        if (!slug) {
            slug = product.slug
        }

        if (slug) {
            await invalidateProductCache(slug)
            revalidatePath(`/products/${slug}`)
        }
        await invalidateHomepageCache()
        await invalidateAllProductCaches()

        revalidatePath('/products')
        revalidatePath('/')

        return { success: true, data: product }
    } catch (error) {
        console.error('Error updating product:', error)
        return { success: false, error: 'Failed to update product' }
    }
}
