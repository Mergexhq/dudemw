import { NextRequest, NextResponse } from 'next/server'
import { InventoryService } from '@/lib/services/inventory'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { InventoryAdjustment } from '@/lib/types/inventory'

/**
 * POST /api/admin/inventory/adjust
 * Adjust stock for a single inventory variant
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await getCurrentAdmin()
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { variant_id, quantity, reason, adjust_type } = body

        if (!variant_id || quantity === undefined || !reason || !adjust_type) {
            return NextResponse.json({ error: 'Missing required fields: variant_id, quantity, reason, adjust_type' }, { status: 400 })
        }

        const adjustment: InventoryAdjustment = { variant_id, quantity, reason, adjust_type }
        const result = await InventoryService.adjustStock(adjustment)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error in POST /api/admin/inventory/adjust:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
