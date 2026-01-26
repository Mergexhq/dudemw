import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function GET(request: Request) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            console.error('[Cron] Unauthorized access attempt to expire-orders')
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        console.log('[Cron] Starting order expiration job...')

        // Calculate 24 hours ago
        const expirationTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        // Expire orders pending for > 24 hours
        const { data: expiredOrders, error } = await supabaseAdmin
            .from('orders')
            .update({
                order_status: 'cancelled',
                payment_status: 'expired',
                updated_at: new Date().toISOString(),
            })
            .eq('payment_method', 'razorpay')
            .eq('payment_status', 'pending')
            .eq('order_status', 'pending')
            .lt('created_at', expirationTime)
            .select('id, razorpay_order_id, customer_name_snapshot, total_amount')

        if (error) {
            console.error('[Cron] Error expiring orders:', error)
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            )
        }

        const expiredCount = expiredOrders?.length || 0
        console.log(`[Cron] Expired ${expiredCount} orders`)

        if (expiredCount > 0) {
            console.log('[Cron] Expired orders:', expiredOrders.map(o => ({
                id: o.id,
                customer: o.customer_name_snapshot,
                amount: o.total_amount
            })))
        }

        return NextResponse.json({
            success: true,
            expired: expiredCount,
            orders: expiredOrders,
            timestamp: new Date().toISOString(),
        })
    } catch (error: any) {
        console.error('[Cron] Unexpected error:', error)
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        )
    }
}
