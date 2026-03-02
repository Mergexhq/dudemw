import { prisma } from '@/lib/db'
import crypto from 'crypto'
import { AdminRole } from '../admin-auth'
import { EmailService } from './resend'

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

function generateInviteToken(): string {
    return crypto.randomBytes(32).toString('hex')
}

function hashInviteToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
}

/** Create a new admin invite */
export async function createInvite(
    data: CreateInviteData
): Promise<{ success: boolean; token?: string; inviteId?: string; inviteUrl?: string; emailSuccess?: boolean; emailError?: string; error?: string }> {
    try {
        // Check pending invite for this email
        const pendingInvite = await prisma.admin_invites.findFirst({
            where: {
                email: data.email,
                used_at: null,
                expires_at: { gt: new Date() },
            },
            select: { id: true },
        })

        if (pendingInvite) {
            return { success: false, error: 'Pending invite already exists for this email' }
        }

        const token = generateInviteToken()
        const tokenHash = hashInviteToken(token)
        const expiryHours = data.expiryHours || 72
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + expiryHours)

        const invite = await prisma.admin_invites.create({
            data: {
                email: data.email,
                role: data.role,
                token_hash: tokenHash,
                expires_at: expiresAt,
                invited_by: data.invitedBy,
            } as any,
        })

        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/invite/accept?token=${token}`

        const emailResult = await EmailService.sendAdminInvite(data.email, data.role, inviteUrl, expiryHours)

        return {
            success: true,
            token,
            inviteId: invite.id,
            inviteUrl,
            emailSuccess: emailResult.success,
            emailError: emailResult.error,
        }
    } catch (error: any) {
        console.error('[InviteService] Exception in createInvite:', error)
        return { success: false, error: error.message || 'Unknown error' }
    }
}

/** Validate an invite token */
export async function validateInviteToken(
    token: string
): Promise<{ valid: boolean; invite?: InviteData; error?: string }> {
    try {
        const tokenHash = hashInviteToken(token)
        const invite = await prisma.admin_invites.findFirst({
            where: { token_hash: tokenHash },
        })

        if (!invite) return { valid: false, error: 'Invalid invite token' }
        if ((invite as any).used_at) return { valid: false, error: 'Invite has already been used' }
        if (new Date((invite as any).expires_at) < new Date()) return { valid: false, error: 'Invite has expired' }

        return { valid: true, invite: invite as unknown as InviteData }
    } catch (error: any) {
        return { valid: false, error: 'Failed to validate invite' }
    }
}

/** Mark an invite as used */
export async function markInviteAsUsed(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.admin_invites.update({
            where: { id: inviteId },
            data: { used_at: new Date() } as any,
        })
        return { success: true }
    } catch (error: any) {
        return { success: false, error: 'Failed to mark invite as used' }
    }
}

/** Resend an invite email */
export async function resendInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const invite = await prisma.admin_invites.findUnique({ where: { id: inviteId } })
        if (!invite) return { success: false, error: 'Invite not found' }
        if ((invite as any).used_at) return { success: false, error: 'Invite has already been used' }

        const token = generateInviteToken()
        const tokenHash = hashInviteToken(token)
        const expiresAt = new Date()
        expiresAt.setHours(expiresAt.getHours() + 72)

        await prisma.admin_invites.update({
            where: { id: inviteId },
            data: { token_hash: tokenHash, expires_at: expiresAt, updated_at: new Date() } as any,
        })

        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/invite/accept?token=${token}`
        await EmailService.sendAdminInvite((invite as any).email, (invite as any).role, inviteUrl, 72)

        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/** Revoke an invite */
export async function revokeInvite(inviteId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await prisma.admin_invites.update({
            where: { id: inviteId },
            data: { expires_at: new Date() } as any,
        })
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

/** Get all invites */
export async function getAllInvites(): Promise<InviteData[]> {
    try {
        const data = await prisma.admin_invites.findMany({
            orderBy: { created_at: 'desc' },
        })
        return data as unknown as InviteData[]
    } catch (error) {
        console.error('[InviteService] Exception in getAllInvites:', error)
        return []
    }
}
