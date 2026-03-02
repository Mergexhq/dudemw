import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { serializePrisma } from '@/lib/utils/prisma-utils'

async function resolveCustomerId(clerkUserId: string): Promise<string | null> {
    if (!clerkUserId) return null
    const customer = await prisma.customers.findUnique({
        where: { auth_user_id: clerkUserId },
        select: { id: true }
    })
    return customer?.id || null
}

// GET /api/addresses
export async function GET() {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const customerId = await resolveCustomerId(userId)
        if (!customerId) {
            return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
        }

        const data = await prisma.addresses.findMany({
            where: { user_id: customerId },
            orderBy: { created_at: 'desc' }
        })

        return NextResponse.json({ success: true, data: serializePrisma(data) })
    } catch (error: any) {
        console.error('GET /api/addresses error:', error)
        return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch addresses' }, { status: 500 })
    }
}

// POST /api/addresses
export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const customerId = await resolveCustomerId(userId)
        if (!customerId) {
            return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
        }

        const body = await req.json()
        const { name, phone, address_line1, address_line2, city, state, pincode, is_default } = body

        const data = await prisma.addresses.create({
            data: {
                user_id: customerId,
                name,
                phone,
                address_line1,
                address_line2: address_line2 || null,
                city,
                state,
                pincode,
                is_default: is_default || false,
            }
        })

        return NextResponse.json({ success: true, data: serializePrisma(data) })
    } catch (error: any) {
        console.error('POST /api/addresses error:', error)
        return NextResponse.json({ success: false, error: error?.message || 'Failed to create address' }, { status: 500 })
    }
}
