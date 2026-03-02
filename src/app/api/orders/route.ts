import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getOrdersForUser } from '@/lib/actions/orders'

// GET /api/orders — returns orders for the signed-in user
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const result = await getOrdersForUser(userId)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error('GET /api/orders error:', error)
        return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch orders' }, { status: 500 })
    }
}
