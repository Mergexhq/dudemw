import { NextRequest, NextResponse } from 'next/server'
import { InventoryService } from '@/lib/services/inventory'
import { getCurrentAdmin } from '@/lib/admin-auth'

/**
 * POST /api/admin/inventory/bulk-adjust
 * Bulk adjust inventory stock from CSV import
 */
export async function POST(request: NextRequest) {
    try {
        const admin = await getCurrentAdmin()
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { adjustments } = body

        if (!adjustments || !Array.isArray(adjustments) || adjustments.length === 0) {
            return NextResponse.json({ error: 'Missing or invalid adjustments array' }, { status: 400 })
        }

        const result = await InventoryService.bulkAdjustStock({ adjustments })

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error in POST /api/admin/inventory/bulk-adjust:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
