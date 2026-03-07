import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/products/featured
 * Returns published products with full data for ProductCard rendering
 * (offer badges, MRP strikethrough, scarcity indicators, etc.)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '4', 10)

        const products = await prisma.products.findMany({
            where: { status: 'published' },
            select: {
                id: true,
                title: true,
                subtitle: true,
                slug: true,
                price: true,
                compare_price: true,
                average_rating: true,
                review_count: true,
                product_images: {
                    select: { image_url: true, is_primary: true },
                    orderBy: { is_primary: 'desc' },
                },
                product_variants: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        discount_price: true,
                        stock: true,
                        image_url: true,
                        variant_images: {
                            select: { image_url: true, position: true },
                            orderBy: { position: 'asc' },
                            take: 2,
                        },
                    },
                },
            },
            take: limit,
            orderBy: { created_at: 'desc' },
        })

        // Map to the shape expected by ProductCard (Product domain type)
        const mapped = products.map((p) => {
            const primaryImage = p.product_images.find((img) => img.is_primary)
            const firstImage = p.product_images[0]
            const imageUrl = primaryImage?.image_url || firstImage?.image_url || '/images/placeholder-product.jpg'
            const allImageUrls = p.product_images.map((img) => img.image_url)

            return {
                id: p.id,
                title: p.title,
                subtitle: p.subtitle ?? null,
                slug: p.slug || '',
                price: p.price || 0,
                compare_price: p.compare_price ?? null,
                images: allImageUrls,
                average_rating: p.average_rating ?? null,
                review_count: p.review_count ?? null,
                // default_variant for quick price/stock display
                default_variant: p.product_variants?.[0] ?? null,
                product_variants: p.product_variants ?? [],
            }
        })

        return NextResponse.json({ success: true, products: mapped })
    } catch (error) {
        console.error('GET /api/products/featured error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 })
    }
}
