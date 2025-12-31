import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { AdminRole } from '../admin-auth'
import { EmailService } from './resend'

/**
 * Admin Invite Service
 * Handles secure admin user invitations
 */

export interface CreateInviteData {
    email: string
    role: AdminRole
    invitedBy: string
    expiryHours?: number
}

export interface InviteData {
    id: string
    email: string
    role: AdminRole
    token_hash: string
    expires_at: string
    used_at: string | null
    invited_by: string
    created_at: string
}

/**
 * Generate a cryptographically secure invite token
 * Returns 64-character hex string
 */
function generateInviteToken(): string {
    return crypto.randomBytes(32).toString('hex')
}

/**
 * Hash an invite token using SHA-256
 */
function hashInviteToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Create a new admin invite
 * Returns the plain token (only shown once) and invite ID
 */
export async function createInvite(
    data: CreateInviteData
): Promise<{ success: boolean; token?: string; inviteId?: string; inviteUrl?: string; emailSuccess?: boolean; emailError?: string; error?: string }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        // Check if email already has an admin account
        const { data: existingProfile } = await supabaseAdmin
            .from('admin_profiles')
            .select('id')
            .eq('user_id', data.email)
            .single()

        if (existingProfile) {
            return { success: false, error: 'User already has an admin account' }
        }

        // Check if there's a pending invite for this email
        const { data: pendingInvite } = await supabaseAdmin
            .from('admin_invites')
            .select('id')
            .eq('email', data.email)
            .is('used_at', null)
            .gt('expires_at', new Date().toISOString())
            .single()

        if (pendingInvite) {
            return { success: false, error: 'Pending invite already exists for this email' }
        }

        // Generate token and hash
        const token = generateInviteToken()
        const tokenHash = hashInviteToken(token)

        // Calculate expiry (default 72 hours)
        const expiryHours = data.expiryHours || 72
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + expiryHours)

        // Create invite record
        const { data: invite, error: insertError } = await supabaseAdmin
            .from('admin_invites')
            .insert({
                email: data.email,
                role: data.role,
                token_hash: tokenHash,
                expires_at: expiresAt.toISOString(),
                invited_by: data.invitedBy
            })
            .select()
            .single()

        if (insertError) {
            console.error('[InviteService] Error creating invite:', insertError)
            return { success: false, error: 'Failed to create invite' }
        }

        // Send invite email
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/invite/accept?token=${token}`

        const emailResult = await EmailService.sendAdminInvite(
            data.email,
            data.role,
            inviteUrl,
            expiryHours
        )

        if (!emailResult.success && !emailResult.skipped) {
            console.warn('[InviteService] Failed to send invite email:', emailResult.error)
            // Don't fail the invite creation if email fails
        }

        return {
            success: true,
            token, // Return plain token (only time it's visible)
            inviteId: invite.id,
            inviteUrl,
            emailSuccess: emailResult.success,
            emailError: emailResult.error
        }
    } catch (error: any) {
        console.error('[InviteService] Exception in createInvite:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}

/**
 * Validate an invite token
 * Returns invite data if valid, null otherwise
 */
export async function validateInviteToken(
    token: string
): Promise<{ valid: boolean; invite?: InviteData; error?: string }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const tokenHash = hashInviteToken(token)

        const { data: invite, error } = await supabaseAdmin
            .from('admin_invites')
            .select('*')
            .eq('token_hash', tokenHash)
            .single()

        if (error || !invite) {
            return { valid: false, error: 'Invalid invite token' }
        }

        // Check if already used
        if (invite.used_at) {
            return { valid: false, error: 'Invite has already been used' }
        }

        // Check if expired
        if (new Date(invite.expires_at) < new Date()) {
            return { valid: false, error: 'Invite has expired' }
        }

        return { valid: true, invite: invite as InviteData }
    } catch (error: any) {
        console.error('[InviteService] Exception in validateInviteToken:', error)
        return { valid: false, error: 'Failed to validate invite' }
    }
}

/**
 * Mark an invite as used
 */
export async function markInviteAsUsed(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { error } = await supabaseAdmin
            .from('admin_invites')
            .update({ used_at: new Date().toISOString() })
            .eq('id', inviteId)

        if (error) {
            console.error('[InviteService] Error marking invite as used:', error)
            return { success: false, error: 'Failed to mark invite as used' }
        }

        return { success: true }
    } catch (error: any) {
        console.error('[InviteService] Exception in markInviteAsUsed:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Resend an invite email
 */
export async function resendInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { data: invite, error } = await supabaseAdmin
            .from('admin_invites')
            .select('*')
            .eq('id', inviteId)
            .single()

        if (error || !invite) {
            return { success: false, error: 'Invite not found' }
        }

        if (invite.used_at) {
            return { success: false, error: 'Invite has already been used' }
        }

        // Generate new token
        const token = generateInviteToken()
        const tokenHash = hashInviteToken(token)

        // Extend expiry
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 72)

        // Update invite
        const { error: updateError } = await supabaseAdmin
            .from('admin_invites')
            .update({
                token_hash: tokenHash,
                expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', inviteId)

        if (updateError) {
            return { success: false, error: 'Failed to update invite' }
        }

        // Send new invite email
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/invite/accept?token=${token}`

        await EmailService.sendAdminInvite(
            invite.email,
            invite.role,
            inviteUrl,
            72
        )

        return { success: true }
    } catch (error: any) {
        console.error('[InviteService] Exception in resendInvite:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Revoke an invite
 */
export async function revokeInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        // Set expiry to now (effectively revoking it)
        const { error } = await supabaseAdmin
            .from('admin_invites')
            .update({ expires_at: new Date().toISOString() })
            .eq('id', inviteId)

        if (error) {
            return { success: false, error: 'Failed to revoke invite' }
        }

        return { success: true }
    } catch (error: any) {
        console.error('[InviteService] Exception in revokeInvite:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Get all invites
 */
export async function getAllInvites(): Promise<InviteData[]> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { data, error } = await supabaseAdmin
            .from('admin_invites')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('[InviteService] Error fetching invites:', error)
            return []
        }

        return (data as InviteData[]) || []
    } catch (error) {
        console.error('[InviteService] Exception in getAllInvites:', error)
        return []
    }
}
