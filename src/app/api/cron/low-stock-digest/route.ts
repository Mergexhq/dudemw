import { NextResponse } from 'next/server'
import { InventoryMonitor } from '@/lib/services/inventory-monitor'

/**
 * Daily Low Stock Digest Cron Job
 * 
 * This endpoint should be called once daily (e.g., via Vercel Cron or external scheduler)
 * to send a digest email of all low stock products to the admin.
 * 
 * Setup Instructions:
 * 1. In Vercel, go to your project settings
 * 2. Add a Cron Job with schedule: "0 9 * * *" (9 AM daily)
 * 3. Set the path to: /api/cron/low-stock-digest
 * 4. Or use an external service like cron-job.org to hit this endpoint daily
 * 
 * For security, you should add a secret token to verify the request.
 */
export async function GET(request: Request) {
    try {
        // Optional: Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        console.log('[Cron] Running daily low stock digest...')

        // Send the digest
        const result = await InventoryMonitor.sendDailyDigest()

        if (result.success) {
            console.log('[Cron] Daily digest sent successfully')
            return NextResponse.json({
                success: true,
                message: 'Daily low stock digest sent successfully'
            })
        } else {
            console.error('[Cron] Failed to send digest:', result.error)
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Failed to send digest'
                },
                { status: 500 }
            )
        }
    } catch (error) {
        console.error('[Cron] Error in low stock digest:', error)
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// Also support POST for flexibility
export async function POST(request: Request) {
    return GET(request)
}
