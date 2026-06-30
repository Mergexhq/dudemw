import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { getReviewById, updateReviewStatus, toggleReviewFeatured, updateAdminReply, deleteReview } from '@/lib/actions/reviews'
import { ReviewStatus } from '@/types/database/reviews'

/**
 * GET /api/admin/reviews/[id]
 * Get a single review with product info.
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getCurrentAdmin()
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const review = await getReviewById(id)
        if (!review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

        return NextResponse.json(review)
    } catch (error) {
        console.error('GET /api/admin/reviews/[id] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * PATCH /api/admin/reviews/[id]
 * Update status, is_featured, or admin_reply.
 * Body: { status?: ReviewStatus, is_featured?: boolean, admin_reply?: string | null }
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getCurrentAdmin()
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const body = await request.json()

        if (body.status !== undefined) {
            const validStatuses: ReviewStatus[] = ['pending', 'approved', 'rejected']
            if (!validStatuses.includes(body.status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
            }
            await updateReviewStatus(id, body.status)
        }

        if (body.is_featured !== undefined) {
            await toggleReviewFeatured(id, Boolean(body.is_featured))
        }

        if ('admin_reply' in body) {
            await updateAdminReply(id, body.admin_reply)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('PATCH /api/admin/reviews/[id] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

/**
 * DELETE /api/admin/reviews/[id]
 * Permanently delete a review.
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getCurrentAdmin()
        if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        await deleteReview(id)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/admin/reviews/[id] error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
