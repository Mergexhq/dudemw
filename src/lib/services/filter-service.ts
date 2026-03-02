"use server"

import { prisma } from "@/lib/db"
import { FilterParams } from "@/lib/utils/filter-utils"

export interface FilteredProduct {
    id: string
    variant_id: string
    title: string
    slug: string
    description: string | null
    price: number
    original_price: number | null
    stock: number
    options: { size?: string; color?: string }
    variant_image: string | null
    is_bestseller: boolean
    is_new_drop: boolean
    is_featured: boolean
}



export interface FilterResult {
    products: FilteredProduct[]
    total: number
    limit: number
    offset: number
}

export interface FilterOption {
    name: string
    hexColor?: string | null
    count?: number
}

export interface FilterOptions {
    sizes: FilterOption[]
    colors: FilterOption[]
    priceRange: { min: number; max: number }
    hasStock: boolean
}

/**
 * Server-side product filtering using Prisma
 */
export async function filterProducts(params: FilterParams): Promise<FilterResult> {
    try {
        const where: any = { status: 'published' }
        if (params.categorySlug) {
            where.product_categories = { some: { categories: { slug: params.categorySlug } } }
        }
        if (params.collectionSlug) {
            where.product_collections = { some: { collections: { slug: params.collectionSlug } } }
        }

        let products = await prisma.products.findMany({
            where,
            include: {
                product_images: true,
                product_variants: {
                    include: {
                        variant_images: true,
                        variant_option_values: {
                            include: {
                                product_option_values: {
                                    include: { product_options: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: params.sortBy === 'price_asc' ? { price: 'asc' } :
                params.sortBy === 'price_desc' ? { price: 'desc' } :
                    { created_at: 'desc' }
        })

        products = products.filter(p => {
            const pPrice = Number(p.price)
            if (params.minPrice && pPrice < params.minPrice) return false;
            if (params.maxPrice && pPrice > params.maxPrice) return false;

            let hasStock = (p.global_stock || 0) > 0;
            p.product_variants.forEach((v: any) => {
                if (v.stock > 0) hasStock = true;
            })

            if (params.inStock && !hasStock) return false;

            if (params.size || params.color) {
                const variants = p.product_variants.filter((v: any) => {
                    let sizeMatch = !params.size
                    let colorMatch = !params.color
                    v.variant_option_values.forEach((vov: any) => {
                        const optName = vov.product_option_values.product_options.name.toLowerCase()
                        const optVal = vov.product_option_values.value
                        if (params.size && optName === 'size' && optVal === params.size) sizeMatch = true;
                        if (params.color && optName === 'color' && optVal === params.color) colorMatch = true;
                    })
                    return sizeMatch && colorMatch
                })
                if (variants.length === 0) return false;
            }

            return true;
        })

        const total = products.length
        const limit = params.limit || 24
        const offset = params.offset || 0
        products = products.slice(offset, offset + limit)

        const mappedProducts: FilteredProduct[] = products.map(p => {
            const defaultVar = p.product_variants[0] || {}
            const sortedImages = p.product_images?.sort((a: any, b: any) => {
                if (a.is_primary && !b.is_primary) return -1
                if (!a.is_primary && b.is_primary) return 1
                return (a.sort_order || 0) - (b.sort_order || 0)
            })
            const primeImage = sortedImages?.[0]?.image_url || null

            return {
                id: p.id,
                variant_id: defaultVar.id || '',
                title: p.title,
                slug: p.slug,
                description: p.description,
                price: Number(p.price),
                original_price: p.compare_price ? Number(p.compare_price) : null,
                stock: p.global_stock || defaultVar.stock || 0,
                options: {},
                variant_image: primeImage,
                is_bestseller: Boolean(p.is_featured),
                is_new_drop: false,
                is_featured: Boolean(p.is_featured)
            }
        })

        return { products: mappedProducts, total, limit, offset }

    } catch (err) {
        console.error("Filter products error:", err)
        return { products: [], total: 0, limit: params.limit || 24, offset: params.offset || 0 }
    }
}

/**
 * Get available filter options for current context
 */
export async function getFilterOptions(
    categorySlug?: string,
    collectionSlug?: string
): Promise<FilterOptions> {
    try {
        const where: any = { status: 'published' }
        if (categorySlug) {
            where.product_categories = { some: { categories: { slug: categorySlug } } }
        }
        if (collectionSlug) {
            where.product_collections = { some: { collections: { slug: collectionSlug } } }
        }

        const products = await prisma.products.findMany({
            where,
            include: {
                product_variants: {
                    include: {
                        variant_option_values: {
                            include: {
                                product_option_values: {
                                    include: { product_options: true }
                                }
                            }
                        }
                    }
                }
            }
        })

        let minPrice = Infinity
        let maxPrice = -Infinity
        let hasStock = false
        const sizes = new Map<string, number>()
        const colors = new Map<string, { count: number; hex?: string }>()

        if (products.length === 0) {
            minPrice = 0
            maxPrice = 10000
        }

        products.forEach(p => {
            const pPrice = Number(p.price)
            if (pPrice < minPrice) minPrice = pPrice
            if (pPrice > maxPrice) maxPrice = pPrice
            if (p.global_stock && p.global_stock > 0) hasStock = true

            p.product_variants.forEach((v: any) => {
                if (v.stock > 0) hasStock = true

                v.variant_option_values.forEach((vov: any) => {
                    const opt = vov.product_option_values.product_options.name.toLowerCase()
                    const val = vov.product_option_values.value
                    if (opt === 'size') {
                        sizes.set(val, (sizes.get(val) || 0) + 1)
                    } else if (opt === 'color') {
                        colors.set(val, { count: (colors.get(val)?.count || 0) + 1 })
                    }
                })
            })
        })

        return {
            sizes: Array.from(sizes.entries()).map(([name, count]) => ({ name, count })),
            colors: Array.from(colors.entries()).map(([name, { count, hex }]) => ({ name, count, hexColor: hex })),
            priceRange: { min: minPrice === Infinity ? 0 : minPrice, max: maxPrice === -Infinity ? 10000 : maxPrice },
            hasStock
        }
    } catch (error) {
        console.error("Get filter options error:", error)
        return {
            sizes: [],
            colors: [],
            priceRange: { min: 0, max: 10000 },
            hasStock: false,
        }
    }
}

