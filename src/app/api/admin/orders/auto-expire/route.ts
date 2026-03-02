import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST() {
    try {
        const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000)

        const ordersToExpire = await prisma.orders.findMany({
            where: {
                payment_method: 'razorpay',
                payment_status: 'pending',
                order_status: 'pending',
                created_at: { lt: expirationTime },
            } as any,
            select: { id: true },
        })

        if (ordersToExpire.length > 0) {
            await prisma.orders.updateMany({
                where: { id: { in: ordersToExpire.map(o => o.id) } },
                data: { order_status: 'cancelled', payment_status: 'expired' } as any,
            })
            console.log(`[Auto-Expire] Expired ${ordersToExpire.length} orders`)
        }

        return NextResponse.json({ success: true, expired: ordersToExpire.length })
    } catch (error: any) {
        console.error('[Auto-Expire] Unexpected error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
