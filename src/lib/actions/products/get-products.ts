'use server'

import { prisma } from '@/lib/db'
import { serializePrisma } from '@/lib/utils/prisma-utils'

export async function getProducts(filters?: {
    search?: string
    category?: string
    status?: string
    stock_status?: string
    price?: { min?: number; max?: number }
    created_at?: { from?: string; to?: string }
    page?: number
    limit?: number
}) {
    try {
        const page = filters?.page || 1
        const limit = filters?.limit || 50
        const offset = (page - 1) * limit

        let whereClause: any = {}

        if (filters?.search) {
            whereClause.title = { contains: filters.search, mode: 'insensitive' }
        }

        if (filters?.status) {
            whereClause.status = filters.status
        }

        if (filters?.category) {
            // filters.category can be a slug (from URL) or a UUID (from admin)
            // Try matching as slug first via nested relation, falling back to ID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(filters.category)
            whereClause.product_categories = {
                some: isUUID
                    ? { category_id: filters.category }
                    : { categories: { slug: filters.category } }
            }
        }

        if (filters?.price) {
            if (filters.price.min !== undefined) {
                whereClause.price = { ...whereClause.price, gte: filters.price.min }
            }
            if (filters.price.max !== undefined) {
                whereClause.price = { ...whereClause.price, lte: filters.price.max }
            }
        }

        if (filters?.created_at) {
            if (filters.created_at.from) {
                whereClause.created_at = { ...whereClause.created_at, gte: new Date(filters.created_at.from) }
            }
            if (filters.created_at.to) {
                whereClause.created_at = { ...whereClause.created_at, lte: new Date(filters.created_at.to) }
            }
        }

        const [data, count] = await Promise.all([
            prisma.products.findMany({
                where: whereClause,
                orderBy: { created_at: 'desc' },
                skip: offset,
                take: limit,
                include: {
                    product_images: {
                        orderBy: { sort_order: 'asc' }
                    },
                    product_variants: {
                        include: {
                            inventory_items: true,
                            variant_images: {
                                orderBy: { position: 'asc' }
                            }
                        }
                    },
                    product_categories: {
                        include: { categories: true }
                    },
                    product_collections: {
                        include: { collections: true }
                    }
                }
            }),
            prisma.products.count({ where: whereClause })
        ])

        let filteredData = data
        if (filters?.stock_status) {
            filteredData = data.filter(product => {
                const totalStock = product.product_variants?.reduce((sum, variant) => {
                    const variantStock = variant.inventory_items?.[0]?.quantity ?? variant.stock ?? 0
                    return sum + variantStock
                }, 0) || product.global_stock || 0

                switch (filters.stock_status) {
                    case 'in_stock': return totalStock >= 10
                    case 'low_stock': return totalStock > 0 && totalStock < 10
                    case 'out_of_stock': return totalStock <= 0
                    default: return true
                }
            })
        }

        const mappedData = filteredData.map(product => {
            const sortedImages = product.product_images?.sort((a: any, b: any) => {
                if (a.is_primary && !b.is_primary) return -1
                if (!a.is_primary && b.is_primary) return 1
                return (a.sort_order || 0) - (b.sort_order || 0)
            })

            return {
                ...product,
                price: product.price ? Number(product.price) : 0,
                compare_price: product.compare_price ? Number(product.compare_price) : null,
                images: sortedImages?.map((img: any) => img.image_url) || [],
            }
        })

        return {
            success: true,
            data: serializePrisma(mappedData),
            pagination: {
                page,
                limit,
                total: count,
                totalPages: Math.ceil(count / limit),
                hasMore: (offset + limit) < count
            }
        }
    } catch (error) {
        console.error('Error fetching products:', error)
        return { success: false, error: 'Failed to fetch products' }
    }
}

export async function getProduct(identifier: string, bySlug = false) {
    try {
        if (!identifier || typeof identifier !== 'string') {
            throw new Error('Invalid product identifier provided')
        }

        const product = await prisma.products.findUnique({
            where: bySlug ? { slug: identifier } : { id: identifier },
            include: {
                product_images: {
                    orderBy: { sort_order: 'asc' }
                },
                product_options: {
                    orderBy: { position: 'asc' },
                    include: {
                        product_option_values: {
                            orderBy: { position: 'asc' }
                        }
                    }
                },
                product_variants: {
                    orderBy: { position: 'asc' },
                    include: {
                        variant_option_values: {
                            include: {
                                product_option_values: {
                                    include: {
                                        product_options: true
                                    }
                                }
                            }
                        },
                        inventory_items: true,
                        variant_images: {
                            orderBy: { position: 'asc' }
                        }
                    }
                },
                product_categories: {
                    include: { categories: true }
                },
                product_collections: {
                    include: { collections: true }
                },
                product_tag_assignments: {
                    include: { product_tags: true }
                }
            }
        })

        if (!product) {
            return { success: false, error: 'Product not found' }
        }

        // Apply fallback standard mapping
        const sortedImages = product.product_images?.sort((a: any, b: any) => {
            if (a.is_primary && !b.is_primary) return -1
            if (!a.is_primary && b.is_primary) return 1
            return (a.sort_order || 0) - (b.sort_order || 0)
        })

        const mappedProduct = {
            ...product,
            price: product.price ? Number(product.price) : 0,
            compare_price: product.compare_price ? Number(product.compare_price) : null,
            images: sortedImages?.map((img: any) => img.image_url) || [],
        }

        return { success: true, data: serializePrisma(mappedProduct) }
    } catch (error) {
        console.error('Error fetching product:', error)
        return { success: false, error: 'Failed to fetch product' }
    }
}

export async function getRandomProducts(limit = 4, excludeId?: string) {
    try {
        const data = await prisma.products.findMany({
            where: { status: 'published', ...(excludeId && { NOT: { id: excludeId } }) },
            include: {
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
            },
            take: 50,
        })

        // If no products, fallback
        if (!data.length) {
            const fallback = await prisma.products.findMany({
                where: { status: 'published' },
                include: {
                    product_images: { select: { image_url: true, is_primary: true, sort_order: true } }
                },
                orderBy: { created_at: 'desc' },
                take: limit,
            })
            const mappedFallback = fallback.map(p => ({
                ...p,
                price: p.price ? Number(p.price) : 0,
                compare_price: p.compare_price ? Number(p.compare_price) : null,
            }))
            return { success: true, data: mappedFallback }
        }

        // Fisher-Yates shuffle
        const shuffled = [...data]
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
                ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }

        const selected = shuffled.slice(0, limit).map(p => {
            const sortedImages = p.product_images?.sort((a: any, b: any) => {
                if (a.is_primary && !b.is_primary) return -1
                if (!a.is_primary && b.is_primary) return 1
                return (a.sort_order || 0) - (b.sort_order || 0)
            })

            return {
                ...p,
                price: p.price ? Number(p.price) : 0,
                compare_price: p.compare_price ? Number(p.compare_price) : null,
                images: sortedImages?.map((img: any) => img.image_url) || [],
            }
        })

        return { success: true, data: serializePrisma(selected) }
    } catch (error) {
        console.error('Error fetching random products:', error)
        return { success: false, error: 'Failed to fetch random products' }
    }
}

export async function getProductsByIds(ids: string[]) {
    try {
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return { success: true, data: [] }
        }

        const products = await prisma.products.findMany({
            where: { id: { in: ids } },
            include: {
                product_images: {
                    orderBy: { sort_order: 'asc' }
                },
                product_variants: {
                    include: {
                        inventory_items: true
                    }
                }
            }
        })

        const mappedProducts = products.map(product => {
            const sortedImages = product.product_images?.sort((a: any, b: any) => {
                if (a.is_primary && !b.is_primary) return -1
                if (!a.is_primary && b.is_primary) return 1
                return (a.sort_order || 0) - (b.sort_order || 0)
            })

            const mappedVariants = product.product_variants?.map(variant => ({
                ...variant,
                price: variant.price ? Number(variant.price) : 0,
                discount_price: variant.discount_price ? Number(variant.discount_price) : null,
            }))

            return {
                ...product,
                price: product.price ? Number(product.price) : 0,
                compare_price: product.compare_price ? Number(product.compare_price) : null,
                images: sortedImages?.map((img: any) => img.image_url) || [],
                product_variants: mappedVariants
            }
        })

        return { success: true, data: serializePrisma(mappedProducts) }
    } catch (error) {
        console.error('Error fetching products by ids:', error)
        return { success: false, error: 'Failed to fetch products' }
    }
}
