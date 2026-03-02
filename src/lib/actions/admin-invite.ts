'use server'

import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { createAdminUser } from '@/lib/admin-auth'

export async function validateInviteAndCreateAdminAction(
    email: string,
    setupKey: string,
    password: string,
    fullName: string
): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
        // 1. Verify invite
        const invite = await prisma.admin_invites.findFirst({
            where: {
                email,
                setup_key: setupKey,
                used_at: null,
                expires_at: { gt: new Date() }
            }
        })

        if (!invite) {
            return { success: false, error: 'Invalid or expired setup key' }
        }

        // 2. Create Clerk user
        const client = await clerkClient()
        const user = await client.users.createUser({
            emailAddress: [email],
            password,
            firstName: fullName.split(' ')[0],
            lastName: fullName.split(' ').slice(1).join(' ') || undefined,
        })

        // 3. Create Admin profile
        const profileResult = await createAdminUser(user.id, invite.role as any, invite.invited_by || 'system')
        if (!profileResult.success) {
            // Rollback clerk user if profile fails
            await client.users.deleteUser(user.id).catch(console.error)
            return { success: false, error: profileResult.error || 'Failed to create admin profile' }
        }

        // 4. Mark invite as used
        await prisma.admin_invites.update({
            where: { id: invite.id },
            data: { used_at: new Date() }
        })

        return { success: true, message: 'Admin account created successfully' }
    } catch (error: any) {
        console.error('Error validating invite:', error)
        return { success: false, error: error.message || 'An unexpected error occurred' }
    }
}
