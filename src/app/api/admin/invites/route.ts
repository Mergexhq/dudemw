import { NextRequest, NextResponse } from 'next/server'
import { createInvite, getAllInvites } from '@/lib/services/admin-invites'
import { hasPermission } from '@/lib/services/permissions'
import { logActivity } from '@/lib/services/activity-logger'
import { getCurrentAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/invites
 * List all admin invites
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

        const invites = await getAllInvites()

        return NextResponse.json({ success: true, invites })
    } catch (error: any) {
        console.error('[API] Error fetching invites:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch invites' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/admin/invites
 * Create a new admin invite
 */
export async function POST(request: NextRequest) {
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

        const body = await request.json()
        const { email, role, expiryHours } = body

        // Validate input
        if (!email || !role) {
            return NextResponse.json(
                { error: 'Email and role are required' },
                { status: 400 }
            )
        }

        // Check rate limit (10 invites per hour)
        const { checkRateLimit } = await import('@/lib/services/rate-limit')
        const rateLimit = await checkRateLimit(admin.user.id, {
            action: 'user.invite',
            limit: 10,
            windowMinutes: 60
        })

        if (!rateLimit.allowed) {
            return NextResponse.json(
                { error: `Rate limit exceeded. Try again in ${rateLimit.remaining} minutes.` },
                { status: 429 }
            )
        }

        // Validate role
        const validRoles = ['admin', 'manager', 'staff']
        if (!validRoles.includes(role)) {
            return NextResponse.json(
                { error: 'Invalid role. Must be admin, manager, or staff' },
                { status: 400 }
            )
        }

        // Create invite
        const result = await createInvite({
            email,
            role,
            invitedBy: admin.user.id,
            expiryHours
        })

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || 'Failed to create invite' },
                { status: 400 }
            )
        }

        // Log activity
        await logActivity({
            adminUserId: admin.user.id,
            action: 'user.invite',
            entityType: 'admin_invite',
            entityId: result.inviteId,
            metadata: { email, role },
            ipAddress: request.headers.get('x-forwarded-for') || (request as any).ip,
            userAgent: request.headers.get('user-agent') || undefined
        })

        return NextResponse.json({
            success: true,
            inviteId: result.inviteId,
            inviteUrl: result.inviteUrl,
            emailSuccess: result.emailSuccess,
            emailError: result.emailError,
            message: result.emailSuccess
                ? 'Invite created and sent successfully'
                : 'Invite created but email failed to send'
        })
    } catch (error: any) {
        console.error('[API] Error creating invite:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create invite' },
            { status: 500 }
        )
    }
}
