import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

/**
 * PATCH /api/admin/products/update-family
 * Updates product_family_id for a batch of products
 */
export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { productIds, familyId } = await request.json()

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return NextResponse.json({ error: 'productIds array is required' }, { status: 400 })
        }

        await prisma.products.updateMany({
            where: { id: { in: productIds } },
            data: { product_family_id: familyId ?? null },
        })

        return NextResponse.json({ success: true, updated: productIds.length })
    } catch (error) {
        console.error('PATCH /api/admin/products/update-family error:', error)
        return NextResponse.json({ error: 'Failed to update product family' }, { status: 500 })
    }
}

/**
 * GET /api/admin/products
 * Used to fetch sibling products by family_id (optionally exclude a product)
 */
export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const familyId = searchParams.get('family_id')
        const exclude = searchParams.get('exclude')

        if (!familyId) return NextResponse.json({ success: true, products: [] })

        const products = await prisma.products.findMany({
            where: {
                product_family_id: familyId,
                ...(exclude ? { id: { not: exclude } } : {}),
            },
            select: { id: true, title: true, slug: true, product_family_id: true },
        })

        return NextResponse.json({ success: true, products })
    } catch (error) {
        console.error('GET /api/admin/products error:', error)
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}
