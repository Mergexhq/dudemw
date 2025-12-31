import { NextRequest, NextResponse } from 'next/server'
import { getRecentActivityLogs } from '@/lib/services/activity-logger'
import { hasPermission } from '@/lib/services/permissions'
import { getCurrentAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/activity-logs
 * Get recent activity logs
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await getCurrentAdmin()

        if (!admin || !admin.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canView = await hasPermission(admin.user.id, 'user.view')
        if (!canView) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const searchParams = request.nextUrl.searchParams
        const limit = parseInt(searchParams.get('limit') || '100')

        const logs = await getRecentActivityLogs(limit)

        return NextResponse.json({ success: true, logs })
    } catch (error: any) {
        console.error('[API] Error fetching activity logs:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch activity logs' },
            { status: 500 }
        )
    }
}
