import { NextRequest, NextResponse } from 'next/server'
import { revokeInvite } from '@/lib/services/admin-invites'
import { hasPermission } from '@/lib/services/permissions'
import { logActivity } from '@/lib/services/activity-logger'
import { getCurrentAdmin } from '@/lib/admin-auth'

/**
 * POST /api/admin/invites/[id]/revoke
 * Revoke an admin invite
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await getCurrentAdmin()

        if (!admin || !admin.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permission
        const canManage = await hasPermission(admin.user.id, 'user.manage')
        if (!canManage) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id: inviteId } = await params

        // Revoke invite
        const result = await revokeInvite(inviteId)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to revoke invite' },
                { status: 400 }
            )
        }

        // Log activity
        await logActivity({
            adminUserId: admin.user.id,
            action: 'user.invite.revoke',
            entityType: 'admin_invite',
            entityId: inviteId,
            ipAddress: request.headers.get('x-forwarded-for') || (request as any).ip,
            userAgent: request.headers.get('user-agent') || undefined
        })

        return NextResponse.json({
            success: true,
            message: 'Invite revoked successfully'
        })
    } catch (error: any) {
        console.error('[API] Error revoking invite:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to revoke invite' },
            { status: 500 }
        )
    }
}
