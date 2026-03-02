import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            console.error('[Cron] Unauthorized access attempt to expire-orders')
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        console.log('[Cron] Starting order expiration job...')

        const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000)

        // Get orders to expire first (for logging)
        const ordersToExpire = await prisma.orders.findMany({
            where: {
                payment_method: 'razorpay',
                payment_status: 'pending',
                order_status: 'pending',
                created_at: { lt: expirationTime },
            } as any,
            select: { id: true, razorpay_order_id: true, customer_name_snapshot: true, total_amount: true } as any,
        }) as any[]

        if (ordersToExpire.length > 0) {
            await prisma.orders.updateMany({
                where: { id: { in: ordersToExpire.map(o => o.id) } },
                data: { order_status: 'cancelled', payment_status: 'expired' } as any,
            })
        }

        const expiredCount = ordersToExpire.length
        console.log(`[Cron] Expired ${expiredCount} orders`)
        if (expiredCount > 0) {
            console.log('[Cron] Expired orders:', ordersToExpire.map(o => ({ id: o.id, customer: o.customer_name_snapshot, amount: o.total_amount })))
        }

        return NextResponse.json({ success: true, expired: expiredCount, orders: ordersToExpire, timestamp: new Date().toISOString() })
    } catch (error: any) {
        console.error('[Cron] Unexpected error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
