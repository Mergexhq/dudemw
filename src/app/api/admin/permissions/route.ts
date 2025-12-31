import { NextRequest, NextResponse } from 'next/server'
import { getUserPermissions } from '@/lib/services/permissions'
import { getCurrentAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/permissions
 * Get all permissions for current user
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await getCurrentAdmin()

        if (!admin || !admin.user) {
            return NextResponse.json({ permissions: [] }, { status: 401 })
        }

        const permissions = await getUserPermissions(admin.user.id)

        return NextResponse.json({ permissions })
    } catch (error: any) {
        console.error('[API] Error fetching permissions:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch permissions' },
            { status: 500 }
        )
    }
}
