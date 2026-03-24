import { prisma } from '@/lib/db'
import { StorageDeletionService } from '@/lib/services/storage-deletion'

export interface ProductAnalytics {
    product_id: string
    view_count: number
    add_to_cart_count: number
    purchase_count: number
    total_revenue: number
    conversion_rate: number
    last_viewed_at?: string
}

export interface ProductSEO {
    meta_title?: string
    meta_description?: string
    keywords?: string[]
    og_image?: string
    seo_score?: number
}

export interface BulkImportProduct {
    title: string
    slug: string
    description?: string
    price: number
    compare_price?: number
    sku: string
    stock: number
    category?: string
    status?: string
}

// Common product include for rich product queries
const productInclude = {
    product_images: {
        select: { id: true, image_url: true, alt_text: true, is_primary: true, sort_order: true },
    },
    product_variants: {
        include: {
            variant_images: { select: { id: true, image_url: true, alt_text: true, position: true } },
        },
    },
    product_categories: {
        include: { categories: { select: { id: true, name: true, slug: true } } },
    },
    product_collections: {
        include: { collections: { select: { id: true, title: true, slug: true } } },
    },
} as const

export class ProductService {
    /** Map product from DB to domain shape */
    private static mapProduct(product: any) {
        if (!product) return product

        const sortedImages = product.product_images?.sort((a: any, b: any) => {
            if (a.is_primary && !b.is_primary) return -1
            if (!a.is_primary && b.is_primary) return 1
            return (a.sort_order || 0) - (b.sort_order || 0)
        })

        const defaultVariant = product.default_variant_id
            ? product.product_variants?.find((v: any) => v.id === product.default_variant_id)
            : product.product_variants?.[0] || null

        return {
            ...product,
            images: sortedImages?.map((img: any) => img.image_url) || [],
            default_variant: defaultVariant,
        }
    }

    /** Get all products with optional filters */
    static async getProducts(filters?: {
        search?: string
        categoryId?: string
        collectionId?: string
        status?: string
        stockStatus?: string
        featured?: boolean
        limit?: number
        offset?: number
        sortBy?: 'created_at' | 'title' | 'price' | 'updated_at'
        sortOrder?: 'asc' | 'desc'
    }) {
        try {
            const where: any = {}

            if (filters?.search) {
                where.OR = [
                    { title: { contains: filters.search, mode: 'insensitive' } },
                    { description: { contains: filters.search, mode: 'insensitive' } },
                    { slug: { contains: filters.search, mode: 'insensitive' } },
                ]
            }

            if (filters?.status && filters.status !== 'all') where.status = filters.status
            if (filters?.featured !== undefined) where.is_featured = filters.featured
            if (filters?.categoryId) {
                where.product_categories = { some: { category_id: filters.categoryId } }
            }
            if (filters?.collectionId) {
                where.product_collections = { some: { collection_id: filters.collectionId } }
            }

            const sortBy = filters?.sortBy || 'created_at'
            const sortOrder = filters?.sortOrder || 'desc'

            let products = await prisma.products.findMany({
                where,
                include: productInclude,
                orderBy: { [sortBy]: sortOrder },
                skip: filters?.offset,
                take: filters?.limit,
            })

            // Stock filter (post-query since it depends on variants)
            if (filters?.stockStatus && filters.stockStatus !== 'all') {
                products = products.filter((p: any) => {
                    const totalStock =
                        p.global_stock ??
                        p.product_variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) ?? 0
                    if (filters.stockStatus === 'in-stock') return totalStock > 0
                    if (filters.stockStatus === 'low-stock') return totalStock > 0 && totalStock < 10
                    if (filters.stockStatus === 'out-of-stock') return totalStock === 0
                    return true
                })
            }

            return { success: true, data: products.map(p => this.mapProduct(p)) }
        } catch (error: any) {
            console.error('Error fetching products:', error?.message)
            return { success: false, error: error?.message || 'Failed to fetch products' }
        }
    }

    /** Get a single product by ID or slug */
    static async getProduct(identifier: string, bySlug = false) {
        try {
            const data = await prisma.products.findUnique({
                where: bySlug ? { slug: identifier } : { id: identifier },
                include: {
                    ...productInclude,
                    product_options: {
                        include: { product_option_values: true },
                    },
                    product_tag_assignments: {
                        include: { product_tags: { select: { id: true, name: true, slug: true } } },
                    },
                    product_variants: {
                        include: {
                            variant_images: true,
                            variant_option_values: {
                                include: {
                                    product_option_values: {
                                        include: { product_options: { select: { id: true, name: true } } },
                                    },
                                },
                            },
                            inventory_items: true,
                        },
                    },
                },
            })

            if (!data) return { success: false, error: 'Product not found' }
            return { success: true, data: this.mapProduct(data) }
        } catch (error) {
            console.error('Error fetching product:', error)
            return { success: false, error: 'Failed to fetch product' }
        }
    }

    /** Get featured products */
    static async getFeaturedProducts(limit = 8) {
        try {
            const data = await prisma.products.findMany({
                where: { is_featured: true, status: 'published' },
                include: productInclude,
                orderBy: { created_at: 'desc' },
                take: limit,
            })
            return { success: true, data: data.map(p => this.mapProduct(p)) }
        } catch (error) {
            console.error('Error fetching featured products:', error)
            return { success: false, error: 'Failed to fetch featured products' }
        }
    }

    /** Get new arrivals (last 30 days) */
    static async getNewArrivals(limit = 8) {
        try {
            const thirtyDaysAgo = new Date()
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

            const data = await prisma.products.findMany({
                where: { status: 'published', created_at: { gte: thirtyDaysAgo } },
                include: productInclude,
                orderBy: { created_at: 'desc' },
                take: limit,
            })
            return { success: true, data: data.map(p => this.mapProduct(p)) }
        } catch (error) {
            console.error('Error fetching new arrivals:', error)
            return { success: false, error: 'Failed to fetch new arrivals' }
        }
    }

    /** Get best sellers from analytics */
    static async getBestSellers(limit = 8) {
        try {
            const analytics = await prisma.product_analytics.findMany({
                orderBy: { purchase_count: 'desc' },
                take: limit,
                select: { product_id: true },
            })

            if (!analytics.length) return this.getNewArrivals(limit)

            const productIds = analytics.map(a => a.product_id)
            const data = await prisma.products.findMany({
                where: { id: { in: productIds }, status: 'published' },
                include: productInclude,
            })

            return { success: true, data: data.map(p => this.mapProduct(p)) }
        } catch (error) {
            console.error('Error fetching best sellers:', error)
            return { success: false, error: 'Failed to fetch best sellers' }
        }
    }

    /** Get random products for recommendations */
    static async getRandomProducts(limit = 4, excludeId?: string) {
        try {
            const data = await prisma.products.findMany({
                where: { status: 'published', ...(excludeId && { NOT: { id: excludeId } }) },
                include: productInclude,
                take: 50,
            })

            if (!data.length) return this.getNewArrivals(limit)

            // Fisher-Yates shuffle
            const shuffled = [...data]
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1))
                    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
            }

            return { success: true, data: shuffled.slice(0, limit).map(p => this.mapProduct(p)) }
        } catch (error) {
            console.error('Error fetching random products:', error)
            return { success: false, error: 'Failed to fetch random products' }
        }
    }

    /** Get products by family (color variants) */
    static async getProductsByFamily(productId: string, productFamilyId: string, limit = 5) {
        try {
            const data = await prisma.products.findMany({
                where: {
                    product_family_id: productFamilyId,
                    status: 'published',
                    NOT: { id: productId },
                },
                include: productInclude,
                orderBy: { created_at: 'desc' },
                take: limit,
            })
            return { success: true, data: data.map(p => this.mapProduct(p)) }
        } catch (error) {
            console.error('Error fetching products by family:', error)
            return { success: false, error: 'Failed to fetch product variants' }
        }
    }

    /** Duplicate a product */
    static async duplicateProduct(productId: string) {
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
                for (const [i, v] of original.product_variants.entries()) {
                    const newVariant = await prisma.product_variants.create({
                        data: {
                            product_id: newProduct.id,
                            name: v.name,
                            sku: `${v.sku}-copy-${Date.now()}-${i}`,
                            price: v.price,
                            stock: v.stock,
                            active: v.active,
                        } as any,
                    })

                    await prisma.inventory_items.create({
                        data: {
                            variant_id: newVariant.id,
                            sku: newVariant.sku,
                            quantity: v.stock,
                            track_quantity: original.track_inventory ?? true,
                        } as any
                    })
                }
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

    /** Create a new product */
    static async createProduct(productData: any) {
        try {
            const slug =
                productData.slug ||
                productData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

            const product = await prisma.products.create({
                data: {
                    title: productData.title,
                    slug,
                    description: productData.description,
                    price: productData.price || 0,
                    compare_price: productData.compare_price,
                    sku: productData.sku,
                    track_quantity: productData.track_quantity ?? true,
                    global_stock: productData.quantity || 0,
                    status: productData.status || 'draft',
                    is_featured: productData.is_featured || false,
                    meta_title: productData.seo?.meta_title,
                    meta_description: productData.seo?.meta_description,
                } as any,
            })

            return { success: true, data: product }
        } catch (error: any) {
            console.error('Error creating product:', error)
            return { success: false, error: error.message || 'Failed to create product' }
        }
    }

    /** Update a product */
    static async updateProduct(productId: string, updates: any) {
        try {
            const data = await prisma.products.update({
                where: { id: productId },
                data: { ...updates, updated_at: new Date() },
            })
            return { success: true, data }
        } catch (error: any) {
            console.error('Error updating product:', error)
            return { success: false, error: error.message || 'Failed to update product' }
        }
    }

    /** Delete a product */
    static async deleteProduct(productId: string) {
        try {
            // Check if any variants are in orders
            const variants = await prisma.product_variants.findMany({
                where: { product_id: productId },
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
                    
                    await tx.product_variants.deleteMany({ where: { product_id: productId } })
                }
                
                // 2. Delete deeply nested product options
                const options = await tx.product_options.findMany({ where: { product_id: productId }, select: { id: true } })
                if (options.length > 0) {
                    const optIds = options.map(o => o.id)
                    await tx.product_option_values.deleteMany({ where: { option_id: { in: optIds } } })
                    await tx.product_options.deleteMany({ where: { product_id: productId } })
                }
                
                // 3. Delete direct product dependencies
                await tx.product_categories.deleteMany({ where: { product_id: productId } })
                await tx.product_collections.deleteMany({ where: { product_id: productId } })
                await tx.product_images.deleteMany({ where: { product_id: productId } })
                await tx.product_analytics.deleteMany({ where: { product_id: productId } })
                await tx.product_tag_assignments.deleteMany({ where: { product_id: productId } })
                await tx.product_tax_rules.deleteMany({ where: { product_id: productId } })
                await tx.low_stock_notifications.deleteMany({ where: { product_id: productId } })
                await tx.product_reviews.deleteMany({ where: { product_id: productId } })
                await tx.supplier_products.deleteMany({ where: { product_id: productId } })
                await tx.wishlists.deleteMany({ where: { product_id: productId } })
                
                // 4. Finally delete the product
                await tx.products.delete({ where: { id: productId } })
            })

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
            return { success: false, error: error.message || 'Failed to delete product' }
        }
    }

    /** Bulk import products from CSV */
    static async bulkImport(products: BulkImportProduct[]) {
        try {
            const results = { success: 0, failed: 0, errors: [] as string[] }

            for (const product of products) {
                try {
                    const existing = await prisma.products.findUnique({
                        where: { slug: product.slug },
                        select: { id: true },
                    })
                    if (existing) {
                        results.failed++
                        results.errors.push(`Product with slug "${product.slug}" already exists`)
                        continue
                    }

                    const newProduct = await prisma.products.create({
                        data: {
                            title: product.title,
                            slug: product.slug,
                            description: product.description,
                            price: product.price,
                            compare_price: product.compare_price,
                            global_stock: product.stock,
                            status: product.status || 'published',
                        } as any,
                    })

                    const newVariant = await prisma.product_variants.create({
                        data: {
                            product_id: newProduct.id,
                            name: 'Default',
                            sku: product.sku,
                            price: product.price,
                            stock: product.stock,
                            active: true,
                        } as any,
                    })

                    await prisma.inventory_items.create({
                        data: {
                            variant_id: newVariant.id,
                            sku: product.sku,
                            quantity: product.stock,
                            track_quantity: true,
                        } as any
                    })

                    if (product.category) {
                        const category = await prisma.categories.findUnique({
                            where: { slug: product.category },
                            select: { id: true },
                        })
                        if (category) {
                            await prisma.product_categories.create({
                                data: { product_id: newProduct.id, category_id: category.id } as any,
                            })
                        }
                    }

                    results.success++
                } catch (error: any) {
                    results.failed++
                    results.errors.push(`Failed to import "${product.title}": ${error.message}`)
                }
            }

            return { success: true, data: results }
        } catch (error) {
            console.error('Error in bulk import:', error)
            return { success: false, error: 'Bulk import failed' }
        }
    }

    /** Export products to CSV format */
    static async exportProducts() {
        try {
            const products = await prisma.products.findMany({
                include: {
                    product_variants: { take: 1 },
                    product_categories: {
                        include: { categories: { select: { name: true } } },
                        take: 1,
                    },
                },
                orderBy: { created_at: 'desc' },
            })

            const csvData = products.map((product: any) => {
                const variant = product.product_variants?.[0]
                const category = product.product_categories?.[0]?.categories

                return {
                    'Product ID': product.id,
                    Title: product.title,
                    Slug: product.slug,
                    Description: product.description || '',
                    Price: product.price,
                    'Compare Price': product.compare_price || '',
                    SKU: variant?.sku || '',
                    Stock: product.global_stock || variant?.stock || 0,
                    Category: category?.name || '',
                    Status: product.status || 'draft',
                    'Created At': product.created_at ? new Date(product.created_at).toLocaleDateString() : '',
                }
            })

            return { success: true, data: csvData }
        } catch (error) {
            console.error('Error exporting products:', error)
            return { success: false, error: 'Failed to export products' }
        }
    }

    /** Track product view */
    static async trackView(productId: string) {
        try {
            await prisma.product_analytics.upsert({
                where: { product_id: productId },
                update: {
                    view_count: { increment: 1 },
                    last_viewed_at: new Date(),
                },
                create: {
                    product_id: productId,
                    view_count: 1,
                    add_to_cart_count: 0,
                    purchase_count: 0,
                    total_revenue: 0,
                    last_viewed_at: new Date(),
                } as any,
            })
            return { success: true }
        } catch (error) {
            console.error('Error tracking view:', error)
            return { success: false }
        }
    }

    /** Track add to cart */
    static async trackAddToCart(productId: string) {
        try {
            await prisma.product_analytics.upsert({
                where: { product_id: productId },
                update: { add_to_cart_count: { increment: 1 } },
                create: {
                    product_id: productId,
                    view_count: 0,
                    add_to_cart_count: 1,
                    purchase_count: 0,
                    total_revenue: 0,
                } as any,
            })
            return { success: true }
        } catch (error) {
            console.error('Error tracking add to cart:', error)
            return { success: false }
        }
    }

    /** Get product analytics */
    static async getProductAnalytics(productId: string) {
        try {
            const analytics = await prisma.product_analytics.findUnique({ where: { product_id: productId } })

            const data = analytics || {
                product_id: productId,
                view_count: 0,
                add_to_cart_count: 0,
                purchase_count: 0,
                total_revenue: 0,
                conversion_rate: 0,
            }

            const viewCount = Number(data.view_count || 0)
            const purchaseCount = Number(data.purchase_count || 0)
            const conversionRate = viewCount > 0 ? (purchaseCount / viewCount) * 100 : 0

            return { success: true, data: { ...data, conversion_rate: conversionRate } }
        } catch (error) {
            console.error('Error fetching product analytics:', error)
            return { success: false, error: 'Failed to fetch analytics' }
        }
    }

    /** Calculate SEO score */
    static calculateSEOScore(product: any): number {
        let score = 0
        if (product.title?.length >= 10 && product.title?.length <= 60) score += 20
        else if (product.title) score += 10
        if (product.description?.length >= 150) score += 20
        else if (product.description?.length >= 50) score += 10
        if (product.meta_title?.length >= 30 && product.meta_title?.length <= 60) score += 15
        else if (product.meta_title) score += 7
        if (product.meta_description?.length >= 120 && product.meta_description?.length <= 160) score += 15
        else if (product.meta_description) score += 7
        if (product.slug?.length >= 3 && !product.slug?.includes('_')) score += 10
        if (product.product_images?.length >= 3) score += 10
        else if (product.product_images?.length >= 1) score += 5
        if (product.product_categories?.length >= 1) score += 10
        return score
    }

    /** Update product SEO */
    static async updateProductSEO(productId: string, seo: ProductSEO) {
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
}
