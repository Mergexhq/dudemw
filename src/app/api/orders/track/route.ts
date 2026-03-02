import { NextRequest, NextResponse } from 'next/server'
import { getOrderForTrackingAction } from '@/lib/actions/orders'

// POST /api/orders/track
export async function POST(req: NextRequest) {
    try {
        const { orderId, phone } = await req.json()

        if (!orderId || !phone) {
            return NextResponse.json({ success: false, error: 'orderId and phone are required' }, { status: 400 })
        }

        const result = await getOrderForTrackingAction(orderId, phone)
        return NextResponse.json(result)
    } catch (error: any) {
        console.error('POST /api/orders/track error:', error)
        return NextResponse.json({ success: false, data: null, error: error?.message || 'Failed to track order' }, { status: 500 })
    }
}
