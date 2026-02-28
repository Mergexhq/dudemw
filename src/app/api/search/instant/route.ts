import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ results: [] })
        }

        // Full-text or ILIKE search on products
        const results = await prisma.products.findMany({
            where: {
                OR: [
                    { title: { contains: query.trim(), mode: 'insensitive' } } as any,
                    { description: { contains: query.trim(), mode: 'insensitive' } } as any,
                ],
                status: 'active',
            } as any,
            select: {
                id: true,
                title: true,
                slug: true,
                price: true,
                compare_price: true,
                images: true,
                in_stock: true,
            } as any,
            take: 8,
        }) as any[]

        return NextResponse.json({ results })
    } catch (error) {
        console.error('Instant search error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
