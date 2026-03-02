import { NextResponse } from 'next/server'
import { InventoryService } from '@/lib/services/inventory'
import { getCurrentAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/inventory/stats
 */
export async function GET() {
    try {
        const admin = await getCurrentAdmin()
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const [statsResult, lowStockResult] = await Promise.all([
            InventoryService.getInventoryStats(),
            InventoryService.getLowStockAlerts(),
        ])

        return NextResponse.json({
            stats: statsResult.success ? statsResult.data : null,
            lowStockAlerts: lowStockResult.success ? lowStockResult.data : [],
        })
    } catch (error) {
        console.error('Error in GET /api/admin/inventory/stats:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
