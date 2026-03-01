import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/products/featured
 * Returns published products with primary images for client-side use
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
                slug: true,
                price: true,
                product_images: {
                    select: { image_url: true, is_primary: true },
                    orderBy: { is_primary: 'desc' },
                },
            },
            take: limit,
            orderBy: { created_at: 'desc' },
        })

        const mapped = products.map((p) => {
            const primaryImage = p.product_images.find((img) => img.is_primary)
            const firstImage = p.product_images[0]
            const imageUrl = primaryImage?.image_url || firstImage?.image_url || '/images/placeholder-product.jpg'
            return { id: p.id, title: p.title, slug: p.slug || '', price: p.price || 0, imageUrl }
        })

        return NextResponse.json({ success: true, products: mapped })
    } catch (error) {
        console.error('GET /api/products/featured error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 })
    }
}
