import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
    try {
        const { items } = await request.json()

        if (!items || !Array.isArray(items)) {
            return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
        }

        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: 'User must be authenticated' }, { status: 401 })
        }

        const cookieStore = await cookies()
        const guestId = cookieStore.get('guest_id')?.value

        let syncedCount = 0
        let skippedCount = 0

        for (const item of items) {
            if (!item.id) continue

            const existing = await prisma.wishlist_items.findFirst({
                where: { user_id: userId, product_id: item.id } as any,
                select: { id: true },
            })

            if (existing) { skippedCount++; continue }

            try {
                await prisma.wishlist_items.create({
                    data: { user_id: userId, product_id: item.id } as any,
                })
                syncedCount++
            } catch (err) {
                console.error('Error syncing wishlist item:', err)
                skippedCount++
            }
        }

        if (guestId) {
            await prisma.wishlist_items.deleteMany({ where: { guest_id: guestId } as any })
        }

        return NextResponse.json({ message: 'Wishlist synced successfully', syncedCount, skippedCount })
    } catch (error) {
        console.error('Wishlist sync error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
