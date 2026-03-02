import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { isSuperAdmin } from '@/lib/admin-auth'

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

        const isSuper = await isSuperAdmin(userId)
        if (!isSuper) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

        // Get all admin profiles from Prisma
        const profiles = await prisma.admin_profiles.findMany({
            where: { deleted_at: null } as any,
            orderBy: { created_at: 'desc' } as any,
        }) as any[]

        // Enrich with Clerk email data
        const client = await clerkClient()
        const users = await Promise.all(profiles.map(async (profile: any) => {
            let email = 'Unknown'
            try {
                const clerkUser = await client.users.getUser(profile.user_id)
                email = clerkUser.emailAddresses?.[0]?.emailAddress || 'Unknown'
            } catch {
                // User may not exist in Clerk
            }
            return {
                id: profile.id,
                user_id: profile.user_id,
                role: profile.role,
                name: profile.name,
                is_active: profile.is_active,
                last_login: profile.last_login,
                approved_by: profile.approved_by,
                approved_at: profile.approved_at,
                created_at: profile.created_at,
                email,
            }
        }))

        return NextResponse.json({ success: true, users })
    } catch (error: any) {
        console.error('[Admin Users API] Error:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
