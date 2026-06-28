import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { getAllReviews, bulkUpdateReviews } from '@/lib/actions/reviews'
import { ReviewFilters } from '@/types/database/reviews'

/**
 * GET /api/admin/reviews
 * Fetch paginated reviews with optional filters.
 * Query params: status, rating, product_id, search, page, limit
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await getCurrentAdmin()
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const sp = request.nextUrl.searchParams
        const filters: ReviewFilters = {
            status: (sp.get('status') as ReviewFilters['status']) || 'all',
            rating: sp.get('rating') ? Number(sp.get('rating')) : 'all',
            search: sp.get('search') || '',
            page: sp.get('page') ? Number(sp.get('page')) : 1,
            limit: sp.get('limit') ? Number(sp.get('limit')) : 20,
        }

        const result = await getAllReviews(filters)
        return NextResponse.json(result)
    } catch (error) {
        console.error('GET /api/admin/reviews error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/admin/reviews
 * Bulk delete reviews.
 * Body: { ids: string[] }
 */
export async function DELETE(request: NextRequest) {
    try {
        const admin = await getCurrentAdmin()
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { ids } = body

        if (!Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
        }

        await bulkUpdateReviews(ids, 'delete')
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/admin/reviews error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * PATCH /api/admin/reviews
 * Bulk status/feature update.
 * Body: { ids: string[], action: 'approve' | 'reject' | 'feature' | 'unfeature' }
 */
export async function PATCH(request: NextRequest) {
    try {
        const admin = await getCurrentAdmin()
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { ids, action } = body

        if (!Array.isArray(ids) || !action) {
            return NextResponse.json({ error: 'ids and action are required' }, { status: 400 })
        }

        await bulkUpdateReviews(ids, action)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('PATCH /api/admin/reviews error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
