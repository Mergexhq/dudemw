import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateGuestId } from '@/lib/utils/guest'
import { cookies } from 'next/headers'
import { getOrCreateCustomerForUser } from '@/lib/actions/customer-domain'

export async function GET(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth()
        const cookieStore = await cookies()
        const guestId = cookieStore.get('guest_id')?.value

        let customerId: string | null = null
        if (clerkUserId) {
            const customerResult = await getOrCreateCustomerForUser(clerkUserId)
            if (customerResult.success && customerResult.data) {
                customerId = customerResult.data.id
            }
        }

        // Build where clause: logged-in users use customer UUID, guests use guest_id
        const whereClause = customerId
            ? { user_id: customerId }
            : guestId
                ? { guest_id: guestId }
                : null

        if (!whereClause) return NextResponse.json({ items: [] })

        const items = await prisma.wishlists.findMany({
            where: whereClause,
            include: {
                products: true,
            },
            orderBy: { created_at: 'desc' },
        })

        return NextResponse.json({ items })
    } catch (error) {
        console.error('Wishlist GET error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const { productId, variantId } = await request.json()
        if (!productId) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })

        const { userId: clerkUserId } = await auth()
        const cookieStore = await cookies()
        let guestId = cookieStore.get('guest_id')?.value

        let customerId: string | null = null
        if (clerkUserId) {
            const customerResult = await getOrCreateCustomerForUser(clerkUserId)
            if (customerResult.success && customerResult.data) {
                customerId = customerResult.data.id
            }
        }

        // Build insert data and where clause based on user type
        if (customerId) {
            const existing = await prisma.wishlists.findFirst({
                where: { user_id: customerId, product_id: productId }
            })
            if (existing) return NextResponse.json({ message: 'Product already in wishlist', item: existing })

            const item = await prisma.wishlists.create({
                data: { user_id: customerId, product_id: productId }
            })
            return NextResponse.json({ item }, { status: 201 })
        } else {
            if (!guestId) guestId = getOrCreateGuestId()

            const existing = await prisma.wishlists.findFirst({
                where: { guest_id: guestId, product_id: productId }
            })
            if (existing) return NextResponse.json({ message: 'Product already in wishlist', item: existing })

            const item = await prisma.wishlists.create({
                data: { guest_id: guestId, product_id: productId }
            })
            return NextResponse.json({ item }, { status: 201 })
        }
    } catch (error) {
        console.error('Wishlist POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        if (!productId) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })

        const { userId: clerkUserId } = await auth()
        const cookieStore = await cookies()
        const guestId = cookieStore.get('guest_id')?.value

        let customerId: string | null = null
        if (clerkUserId) {
            const customerResult = await getOrCreateCustomerForUser(clerkUserId)
            if (customerResult.success && customerResult.data) {
                customerId = customerResult.data.id
            }
        }

        if (customerId) {
            await prisma.wishlists.deleteMany({ where: { user_id: customerId, product_id: productId } })
        } else if (guestId) {
            await prisma.wishlists.deleteMany({ where: { guest_id: guestId, product_id: productId } })
        } else {
            return NextResponse.json({ error: 'Guest ID not found. Please refresh the page.' }, { status: 400 })
        }

        return NextResponse.json({ message: 'Removed from wishlist' })
    } catch (error) {
        console.error('Wishlist DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
