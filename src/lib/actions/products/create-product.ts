'use server'

import { prisma } from '@/lib/db'
import { invalidateHomepageCache, invalidateAllProductCaches } from '@/lib/cache/server-cache'
import { revalidatePath } from 'next/cache'
import { serializePrisma } from '@/lib/utils/prisma-utils'

export async function createProduct(productData: {
    // General
    title: string
    subtitle?: string
    description?: string
    highlights?: string[]
    status: 'draft' | 'published' | 'archived'

    // Pricing
    price?: number
    compare_price?: number
    cost?: number
    taxable?: boolean

    // Inventory
    track_inventory?: boolean
    allow_backorders?: boolean
    low_stock_threshold?: number
    global_stock?: number

    // SEO
    meta_title?: string
    meta_description?: string
    url_handle?: string

    // Images
    images?: { url: string; alt: string; isPrimary: boolean }[]

    // Options and Variants
    options?: { name: string; values: { name: string; hexColor?: string }[] }[]
    variants?: {
        name: string
        sku: string
        price: number
        comparePrice?: number
        stock: number
        active: boolean
        combinations: { [optionName: string]: string }
    }[]

    // Organization
    categoryIds?: string[]
    collectionIds?: string[]
    tags?: string[]

    // Sibling Linking
    product_family_id?: string | null
}) {
    try {
        console.log('=== Starting Product Creation ===')
        console.log('Product title:', productData.title)
        console.log('Variant mode:', productData.variants && productData.variants.length > 0 ? 'variants' : 'single')

        // Validate required fields
        if (!productData.title || productData.title.trim() === '') {
            throw new Error('Product title is required')
        }

        const hasSingleMode = !productData.variants || productData.variants.length === 0
        if (hasSingleMode) {
            if (productData.price !== undefined && productData.price !== null && productData.price <= 0) {
                throw new Error('Product price must be greater than 0')
            }
        }

        let baseSlug = productData.url_handle || productData.title.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '')

        let slug = baseSlug
        let slugExists = true
        let attempt = 0
        const maxAttempts = 10

        while (slugExists && attempt < maxAttempts) {
            const existingProduct = await prisma.products.findUnique({
                where: { slug }
            })

            if (existingProduct) {
                attempt++
                if (attempt === 1) {
                    slug = `${baseSlug}-${Date.now()}`
                } else {
                    slug = `${baseSlug}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
                }
            } else {
                slugExists = false
            }
        }

        if (slugExists) {
            throw new Error('Failed to generate a unique slug after multiple attempts')
        }

        let finalPrice = productData.price
        let finalComparePrice = productData.compare_price
        let finalGlobalStock = productData.global_stock

        if (!hasSingleMode && productData.variants && productData.variants.length > 0) {
            const validPrices = productData.variants
                .filter(v => v.active && v.price > 0)
                .map(v => v.price)

            if (validPrices.length > 0) {
                finalPrice = Math.min(...validPrices)
            }

            const validComparePrices = productData.variants
                .filter(v => v.active && v.comparePrice && v.comparePrice > 0)
                .map(v => v.comparePrice as number)

            if (validComparePrices.length > 0) {
                finalComparePrice = Math.min(...validComparePrices)
            }

            finalGlobalStock = productData.variants.reduce((sum, v) => sum + (v.stock || 0), 0)
        }

        const productInsertData: any = {
            title: productData.title.trim(),
            status: productData.status,
            highlights: productData.highlights || [],
            taxable: productData.taxable ?? true,
            track_inventory: productData.track_inventory ?? true,
            allow_backorders: productData.allow_backorders ?? false,
            low_stock_threshold: productData.low_stock_threshold ?? 5,
            slug: slug,
            product_family_id: productData.product_family_id || `${slug}-family`,
        }

        if (productData.subtitle) productInsertData.subtitle = productData.subtitle.trim()
        if (productData.description) productInsertData.description = productData.description.trim()
        if (finalPrice !== undefined && finalPrice !== null) productInsertData.price = finalPrice
        if (finalComparePrice !== undefined && finalComparePrice !== null) productInsertData.compare_price = finalComparePrice
        if (finalGlobalStock !== undefined && finalGlobalStock !== null) productInsertData.global_stock = finalGlobalStock
        if (productData.meta_title) productInsertData.meta_title = productData.meta_title.trim()
        if (productData.meta_description) productInsertData.meta_description = productData.meta_description.trim()
        if (productData.url_handle) productInsertData.url_handle = productData.url_handle.trim()

        // 1. Create product using Prisma transaction to handle everything atomicaly if possible, but step by step is easier.
        const product = await prisma.products.create({
            data: productInsertData
        })

        const productId = product.id

        // 2. Images
        if (productData.images && productData.images.length > 0) {
            const imageInserts = productData.images
                .filter(img => !img.url.startsWith('blob:'))
                .map((img, index) => ({
                    product_id: productId,
                    image_url: img.url,
                    alt_text: img.alt,
                    is_primary: img.isPrimary,
                    sort_order: index,
                }))

            if (imageInserts.length > 0) {
                await prisma.product_images.createMany({ data: imageInserts })
            }
        }

        // 3. Options and Variants
        if (productData.options && productData.options.length > 0) {
            for (const [optionIndex, option] of productData.options.entries()) {
                const createdOption = await prisma.product_options.create({
                    data: {
                        product_id: productId,
                        name: option.name,
                        position: optionIndex,
                    }
                })

                if (option.values.length > 0) {
                    const valueInserts = option.values.map((v, i) => ({
                        option_id: createdOption.id,
                        name: v.name,
                        hex_color: v.hexColor,
                        position: i
                    }))
                    await prisma.product_option_values.createMany({ data: valueInserts })
                }
            }
        }

        if (productData.variants && productData.variants.length > 0) {
            const skus = productData.variants.map(v => v.sku)
            const uniqueSkus = new Set(skus)
            if (skus.length !== uniqueSkus.size) {
                const duplicates = skus.filter((sku, index) => skus.indexOf(sku) !== index)
                throw new Error(`Duplicate SKUs detected in variants: ${duplicates.join(', ')}`)
            }

            const existingVariants = await prisma.product_variants.findMany({
                where: { sku: { in: skus } }
            })
            const existingSkuSet = new Set(existingVariants.map(v => v.sku))

            for (const variant of productData.variants) {
                if (existingSkuSet.has(variant.sku)) {
                    variant.sku = `${variant.sku}-${Date.now()}`
                }
            }

            for (const [variantIndex, variant] of productData.variants.entries()) {
                const createdVariant = await prisma.product_variants.create({
                    data: {
                        product_id: productId,
                        name: variant.name,
                        sku: variant.sku,
                        price: variant.price,
                        discount_price: variant.comparePrice,
                        stock: variant.stock,
                        active: variant.active,
                        position: variantIndex,
                    }
                })

                await prisma.inventory_items.create({
                    data: {
                        variant_id: createdVariant.id,
                        sku: variant.sku,
                        quantity: variant.stock,
                        track_quantity: productData.track_inventory ?? true,
                        allow_backorders: productData.allow_backorders ?? false,
                        low_stock_threshold: productData.low_stock_threshold ?? 5,
                    }
                })

                // linking variant to option values
                if (productData.options) {
                    for (const [optionName, valueName] of Object.entries(variant.combinations)) {
                        const optionData = await prisma.product_options.findFirst({
                            where: { product_id: productId, name: optionName }
                        })
                        if (optionData) {
                            const optionValueData = await prisma.product_option_values.findFirst({
                                where: { option_id: optionData.id, name: valueName }
                            })
                            if (optionValueData) {
                                await prisma.variant_option_values.create({
                                    data: {
                                        variant_id: createdVariant.id,
                                        option_value_id: optionValueData.id
                                    }
                                })
                            }
                        }
                    }
                }
            }
        }

        // 4. Link Categories
        if (productData.categoryIds && productData.categoryIds.length > 0) {
            await prisma.product_categories.createMany({
                data: productData.categoryIds.map(id => ({
                    product_id: productId,
                    category_id: id
                }))
            })
        }

        // 5. Link Collections
        if (productData.collectionIds && productData.collectionIds.length > 0) {
            await prisma.product_collections.createMany({
                data: productData.collectionIds.map((id, idx) => ({
                    product_id: productId,
                    collection_id: id,
                    position: idx
                }))
            })
        }

        // 6. Link Tags
        if (productData.tags && productData.tags.length > 0) {
            for (const tagName of productData.tags) {
                const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

                const tag = await prisma.product_tags.upsert({
                    where: { slug: tagSlug },
                    update: { name: tagName },
                    create: { name: tagName, slug: tagSlug }
                })

                await prisma.product_tag_assignments.create({
                    data: {
                        product_id: productId,
                        tag_id: tag.id
                    }
                })
            }
        }

        console.log('=== Product Creation Complete ===')

        await invalidateHomepageCache()
        await invalidateAllProductCaches()

        revalidatePath('/admin/products')
        revalidatePath('/')
        revalidatePath('/products')

        return { success: true, data: serializePrisma(product) }
    } catch (error) {
        console.error('Error updating product:', error)
        return { success: false, error: 'Failed to update product' }
    }
}
