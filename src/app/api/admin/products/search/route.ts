import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

/**
 * GET /api/admin/products/search
 * Search products for admin use (category/collection creation)
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '100', 10)
        const sortBy = searchParams.get('sortBy') || 'title'
        const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc'

        const products = await prisma.products.findMany({
            include: {
                product_images: { orderBy: { is_primary: 'desc' } },
                product_variants: { where: { active: true } },
            },
            orderBy: { [sortBy]: sortOrder },
            take: limit,
        })

        // Map to expected shape for client components
        const mapped = products.map(p => ({
            ...p,
            product_images: p.product_images,
            product_variants: p.product_variants,
        }))

        return NextResponse.json({ success: true, data: mapped })
    } catch (error) {
        console.error('GET /api/admin/products/search error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 })
    }
}
