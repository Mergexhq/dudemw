import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

export async function POST() {
    try {
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
            .select('id')

        if (error) {
            console.error('[Auto-Expire] Error:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        const expiredCount = expiredOrders?.length || 0

        if (expiredCount > 0) {
            console.log(`[Auto-Expire] Expired ${expiredCount} orders`)
        }

        return NextResponse.json({
            success: true,
            expired: expiredCount,
        })
    } catch (error: any) {
        console.error('[Auto-Expire] Unexpected error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
