import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/categories
 * Returns all categories, optionally filtered by active status
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const active = searchParams.get('active')

        const categories = await prisma.categories.findMany({
            where: active === 'true' ? { is_active: true } : undefined,
            orderBy: { name: 'asc' },
        })

        return NextResponse.json({ success: true, categories })
    } catch (error) {
        console.error('GET /api/categories error:', error)
        return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
    }
}
