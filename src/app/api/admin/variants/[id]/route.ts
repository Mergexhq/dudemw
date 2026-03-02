import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

/**
 * PATCH /api/admin/variants/[id]
 * Update a single product variant (stock, active, price, etc.)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()

        const variant = await prisma.product_variants.update({
            where: { id },
            data: body,
        })

        return NextResponse.json({ success: true, variant })
    } catch (error) {
        console.error('PATCH /api/admin/variants/[id] error:', error)
        return NextResponse.json({ error: 'Failed to update variant' }, { status: 500 })
    }
}
