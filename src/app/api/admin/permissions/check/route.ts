import { NextRequest, NextResponse } from 'next/server'
import { hasPermission, getUserPermissions } from '@/lib/services/permissions'
import { getCurrentAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/permissions/check?permission=<PERMISSION>
 * Check if current user has a specific permission
 */
export async function GET(request: NextRequest) {
    try {
        const admin = await getCurrentAdmin()

        if (!admin || !admin.user) {
            return NextResponse.json({ hasPermission: false }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams
        const permission = searchParams.get('permission')

        if (!permission) {
            return NextResponse.json(
                { error: 'Permission parameter is required' },
                { status: 400 }
            )
        }

        const result = await hasPermission(admin.user.id, permission)

        return NextResponse.json({ hasPermission: result })
    } catch (error: any) {
        console.error('[API] Error checking permission:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to check permission' },
            { status: 500 }
        )
    }
}
