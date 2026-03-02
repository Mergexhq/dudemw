import { NextRequest, NextResponse } from 'next/server'
import { InventoryService } from '@/lib/services/inventory'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { InventoryFilters } from '@/lib/types/inventory'

/**
 * GET /api/admin/inventory
 * Get inventory items with optional filters and pagination
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await getCurrentAdmin()
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams

        const filters: InventoryFilters = {
            search: searchParams.get('search') || undefined,
            stockStatus: (searchParams.get('stockStatus') as InventoryFilters['stockStatus']) || 'all',
        }

        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '50', 10)

        const result = await InventoryService.getInventoryItems(filters, page, limit)

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json({
            data: result.data,
            total: result.total,
            pagination: result.pagination,
        })
    } catch (error) {
        console.error('Error in GET /api/admin/inventory:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * GET /api/admin/inventory/stats
 * Served by /api/admin/inventory?type=stats
 */
