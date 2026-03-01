"use server"

import prisma from '@/lib/db'

interface MergeGuestDataInput {
    userId: string
    email?: string
    phone?: string
    guestId?: string
}

interface MergeResult {
    success: boolean
    mergedItems?: {
        cartItems: number
        wishlistItems: number
        orders: number
    }
    customerId?: string
    error?: string
}

export async function mergeGuestData(input: MergeGuestDataInput): Promise<MergeResult> {
    const { userId, email, phone, guestId } = input

    try {
        console.log('[MergeGuestData] Starting merge for userId:', userId, 'guestId:', guestId)

        // 1. Find guest customer records
        const guestCustomers = await prisma.customers.findMany({
            where: {
                customer_type: 'guest',
                ...(email ? { email } : phone ? { phone } : {})
            }
        })

        const guestCustomer = guestCustomers?.[0]
        console.log('[MergeGuestData] Found guest customers:', guestCustomers?.length || 0)

        // 2. Get or create the new customer record
        let newCustomer = await prisma.customers.findFirst({
            where: { auth_user_id: userId }
        })

        if (!newCustomer) {
            newCustomer = await prisma.customers.create({
                data: {
                    auth_user_id: userId,
                    email: email || null,
                    phone: phone || null,
                    customer_type: 'registered',
                    status: 'active'
                }
            })
        }

        let mergedCartItems = 0
        let mergedWishlistItems = 0
        let mergedOrders = 0

        // 3. Merge Cart Items
        if (guestId) {
            const guestCartItems = await prisma.cart_items.findMany({
                where: { guest_id: guestId }
            })

            if (guestCartItems.length > 0) {
                console.log('[MergeGuestData] Found', guestCartItems.length, 'guest cart items')

                const userCartItems = await prisma.cart_items.findMany({
                    where: { user_id: userId }
                })

                const userCartMap = new Map(userCartItems.map(item => [item.variant_id, item]))

                for (const guestItem of guestCartItems) {
                    const existingItem = userCartMap.get(guestItem.variant_id)

                    if (existingItem) {
                        await prisma.cart_items.update({
                            where: { id: existingItem.id },
                            data: { quantity: (existingItem.quantity ?? 0) + (guestItem.quantity ?? 0) }
                        })
                        await prisma.cart_items.delete({ where: { id: guestItem.id } })
                    } else {
                        await prisma.cart_items.update({
                            where: { id: guestItem.id },
                            data: { user_id: userId, guest_id: null }
                        })
                    }
                    mergedCartItems++
                }
            }
        }

        // 4. Wishlist merge (wishlists table uses user_id only, no guest_id)
        // Guest wishlists cannot be migrated without guest_id column - skip silently


        // 5. Reassign Orders by guest_id
        if (guestId) {
            const guestOrders = await prisma.orders.updateMany({
                where: { guest_id: guestId, user_id: null },
                data: { user_id: userId, customer_id: newCustomer.id }
            })
            mergedOrders += guestOrders.count
            console.log('[MergeGuestData] Reassigned', guestOrders.count, 'orders via guest_id')
        }

        // 5b. Reassign orders by email
        if (email && guestCustomer) {
            const emailOrders = await prisma.orders.updateMany({
                where: { guest_email: email, user_id: null },
                data: { user_id: userId, customer_id: newCustomer.id }
            })
            mergedOrders += emailOrders.count
            console.log('[MergeGuestData] Reassigned', emailOrders.count, 'orders via email')
        }

        // 6. Mark guest customer as merged
        if (guestCustomer) {
            const metadata = typeof guestCustomer.metadata === 'object' && guestCustomer.metadata !== null
                ? guestCustomer.metadata as Record<string, any>
                : {}

            await prisma.customers.update({
                where: { id: guestCustomer.id },
                data: {
                    status: 'merged',
                    metadata: {
                        ...metadata,
                        merged_into_user_id: userId,
                        merged_at: new Date().toISOString()
                    }
                }
            })
        }

        console.log('[MergeGuestData] Merge complete:', { cartItems: mergedCartItems, wishlistItems: mergedWishlistItems, orders: mergedOrders })

        return {
            success: true,
            customerId: newCustomer.id,
            mergedItems: { cartItems: mergedCartItems, wishlistItems: mergedWishlistItems, orders: mergedOrders }
        }
    } catch (error: any) {
        console.error('[MergeGuestData] Unexpected error:', error)
        return { success: false, error: error.message || 'Unexpected error during merge' }
    }
}
