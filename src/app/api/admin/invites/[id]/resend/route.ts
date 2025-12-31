import { NextRequest, NextResponse } from 'next/server'
import { resendInvite } from '@/lib/services/admin-invites'
import { hasPermission } from '@/lib/services/permissions'
import { logActivity } from '@/lib/services/activity-logger'
import { getCurrentAdmin } from '@/lib/admin-auth'

/**
 * POST /api/admin/invites/[id]/resend
 * Resend an admin invite
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
        const canInvite = await hasPermission(admin.user.id, 'user.invite')
        if (!canInvite) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id: inviteId } = await params

        // Resend invite
        const result = await resendInvite(inviteId)

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to resend invite' },
                { status: 400 }
            )
        }

        // Log activity
        await logActivity({
            adminUserId: admin.user.id,
            action: 'user.invite.resend',
            entityType: 'admin_invite',
            entityId: inviteId,
            ipAddress: request.headers.get('x-forwarded-for') || (request as any).ip,
            userAgent: request.headers.get('user-agent') || undefined
        })

        return NextResponse.json({
            success: true,
            message: 'Invite resent successfully'
        })
    } catch (error: any) {
        console.error('[API] Error resending invite:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to resend invite' },
            { status: 500 }
        )
    }
}
