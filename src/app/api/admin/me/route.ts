import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const profile = await prisma.admin_profiles.findFirst({
            where: { user_id: userId } as any,
            select: { role: true, name: true, is_active: true } as any,
        }) as any

        return NextResponse.json({
            role: profile?.role || 'staff',
            name: profile?.name || null,
            is_active: profile?.is_active ?? false,
        })
    } catch (error: any) {
        console.error('[Admin Me API] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, avatar_url } = body

        await prisma.admin_profiles.updateMany({
            where: { user_id: userId } as any,
            data: { name, avatar_url, updated_at: new Date() } as any,
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('[Admin Me PATCH API] Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
