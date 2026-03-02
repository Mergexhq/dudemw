import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/categories
 * Returns all categories, optionally filtered by active status or search
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const active = searchParams.get('active')
        const search = searchParams.get('search')

        const categories = await prisma.categories.findMany({
            where: {
                ...(active === 'true' ? { status: 'active' } : {}),
                ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
            } as any,
            orderBy: { name: 'asc' } as any,
        })

        return NextResponse.json({ success: true, categories })
    } catch (error) {
        console.error('GET /api/categories error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
    }
}

/**
 * POST /api/categories
 * Create a new category
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const category = await prisma.categories.create({ data: body as any })
        return NextResponse.json({ success: true, category }, { status: 201 })
    } catch (error) {
        console.error('POST /api/categories error:', error)
        return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 })
    }
}
