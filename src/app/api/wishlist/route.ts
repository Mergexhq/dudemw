import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'
import { getOrCreateGuestId } from '@/lib/utils/guest'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()
        const cookieStore = await cookies()
        const guestId = cookieStore.get('guest_id')?.value

        const whereClause = userId
            ? { user_id: userId }
            : guestId
                ? { guest_id: guestId }
                : null

        if (!whereClause) return NextResponse.json({ items: [] })

        const items = await prisma.wishlist_items.findMany({
            where: whereClause as any,
            include: {
                products: { select: { id: true, title: true, slug: true, price: true, compare_price: true, images: true, description: true, in_stock: true } } as any,
                product_variants: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        discount_price: true,
                        sku: true,
                        image_url: true,
                        variant_images: { select: { image_url: true } },
                    },
                } as any,
            } as any,
            orderBy: { created_at: 'desc' },
        }) as any[]

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

        const { userId } = await auth()
        const cookieStore = await cookies()
        let guestId = cookieStore.get('guest_id')?.value

        const insertData: any = { product_id: productId, variant_id: variantId || null }
        if (userId) {
            insertData.user_id = userId
        } else {
            if (!guestId) guestId = getOrCreateGuestId()
            insertData.guest_id = guestId
        }

        const whereClause: any = { product_id: productId, variant_id: variantId || null }
        if (userId) whereClause.user_id = userId
        else whereClause.guest_id = guestId

        const existing = await prisma.wishlist_items.findFirst({ where: whereClause as any }) as any
        if (existing) return NextResponse.json({ message: 'Product already in wishlist', item: existing })

        const item = await prisma.wishlist_items.create({ data: insertData as any }) as any
        return NextResponse.json({ item }, { status: 201 })
    } catch (error) {
        console.error('Wishlist POST error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        const variantId = searchParams.get('variantId')
        if (!productId) return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })

        const { userId } = await auth()
        const cookieStore = await cookies()
        const guestId = cookieStore.get('guest_id')?.value

        const whereClause: any = {
            product_id: productId,
            variant_id: (variantId && variantId !== 'null' && variantId !== 'undefined') ? variantId : null,
        }
        if (userId) whereClause.user_id = userId
        else if (guestId) whereClause.guest_id = guestId
        else return NextResponse.json({ error: 'Guest ID not found. Please refresh the page.' }, { status: 400 })

        await prisma.wishlist_items.deleteMany({ where: whereClause as any })
        return NextResponse.json({ message: 'Removed from wishlist' })
    } catch (error) {
        console.error('Wishlist DELETE error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
