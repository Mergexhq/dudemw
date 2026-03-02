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

// PATCH /api/addresses/[id]  — update fields
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const customerId = await resolveCustomerId(userId)
        if (!customerId) {
            return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
        }

        const { id: addressId } = await params
        const body = await req.json()

        // Handle set-default action
        if (body.action === 'set-default') {
            await prisma.addresses.updateMany({
                where: { user_id: customerId },
                data: { is_default: false }
            })
            await prisma.addresses.update({
                where: { id: addressId, user_id: customerId },
                data: { is_default: true }
            })
            return NextResponse.json({ success: true })
        }

        // Handle normal update
        const { name, phone, address_line1, address_line2, city, state, pincode } = body
        const data = await prisma.addresses.update({
            where: { id: addressId, user_id: customerId },
            data: {
                name,
                phone,
                address_line1,
                address_line2: address_line2 || null,
                city,
                state,
                pincode,
                updated_at: new Date(),
            }
        })
        return NextResponse.json({ success: true, data: serializePrisma(data) })
    } catch (error: any) {
        console.error('PATCH /api/addresses/[id] error:', error)
        return NextResponse.json({ success: false, error: error?.message || 'Failed to update address' }, { status: 500 })
    }
}

// DELETE /api/addresses/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        const customerId = await resolveCustomerId(userId)
        if (!customerId) {
            return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })
        }

        const { id: addressId } = await params
        await prisma.addresses.delete({
            where: { id: addressId, user_id: customerId }
        })
        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('DELETE /api/addresses/[id] error:', error)
        return NextResponse.json({ success: false, error: error?.message || 'Failed to delete address' }, { status: 500 })
    }
}
