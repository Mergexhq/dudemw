import { NextRequest, NextResponse } from 'next/server'
import { validateInviteToken, markInviteAsUsed } from '@/lib/services/admin-invites'
import { createAdminUser } from '@/lib/admin-auth'
import { logActivity } from '@/lib/services/activity-logger'

/**
 * POST /api/admin/invites/accept
 * Accept an admin invite and create account
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { token, password, name } = body

        // Validate input
        if (!token || !password) {
            return NextResponse.json(
                { error: 'Token and password are required' },
                { status: 400 }
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Validate invite token
        const validation = await validateInviteToken(token)

        if (!validation.valid || !validation.invite) {
            return NextResponse.json(
                { error: validation.error || 'Invalid invite' },
                { status: 400 }
            )
        }

        const invite = validation.invite

        // Create admin user
        const createResult = await createAdminUser(
            invite.email,
            password,
            invite.role,
            invite.invited_by
        )

        if (!createResult.success) {
            return NextResponse.json(
                { error: createResult.error || 'Failed to create admin account' },
                { status: 500 }
            )
        }

        // Mark invite as used
        await markInviteAsUsed(invite.id)

        // Update admin profile with name if provided
        if (name && createResult.userId) {
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
            const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
            const { createClient } = await import('@supabase/supabase-js')
            const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

            await supabaseAdmin
                .from('admin_profiles')
                .update({ name })
                .eq('user_id', createResult.userId)
        }

        // Log activity
        await logActivity({
            adminUserId: createResult.userId!,
            action: 'user.invite.accept',
            entityType: 'admin_invite',
            entityId: invite.id,
            metadata: { email: invite.email, role: invite.role },
            ipAddress: request.headers.get('x-forwarded-for') || undefined,
            userAgent: request.headers.get('user-agent') || undefined
        })

        return NextResponse.json({
            success: true,
            message: 'Account created successfully',
            userId: createResult.userId
        })
    } catch (error: any) {
        console.error('[API] Error accepting invite:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to accept invite' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/admin/invites/accept?token=<TOKEN>
 * Validate an invite token (for pre-flight check)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json(
                { error: 'Token is required' },
                { status: 400 }
            )
        }

        // Validate invite token
        const validation = await validateInviteToken(token)

        if (!validation.valid || !validation.invite) {
            return NextResponse.json(
                { valid: false, error: validation.error },
                { status: 200 }
            )
        }

        return NextResponse.json({
            valid: true,
            invite: {
                email: validation.invite.email,
                role: validation.invite.role,
                expiresAt: validation.invite.expires_at
            }
        })
    } catch (error: any) {
        console.error('[API] Error validating invite:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to validate invite' },
            { status: 500 }
        )
    }
}
