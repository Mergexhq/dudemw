import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getGuestIdFromCookie, clearGuestId } from '@/lib/utils/guest'
import { cookies } from 'next/headers'

/**
 * POST /api/wishlist/sync
 * Sync guest wishlist items to authenticated user's wishlist
 * Called when user logs in
 */
export async function POST(request: NextRequest) {
    try {
        const { items } = await request.json()

        if (!items || !Array.isArray(items)) {
            return NextResponse.json(
                { error: 'Items array is required' },
                { status: 400 }
            )
        }

        const supabase = await createServerSupabase()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'User must be authenticated' },
                { status: 401 }
            )
        }

        // Get guest ID
        const cookieStore = await cookies()
        const guestIdCookie = cookieStore.get('guest_id')
        const guestId = guestIdCookie?.value

        let syncedCount = 0
        let skippedCount = 0


        // Process each item from local storage
        for (const item of items) {
            if (!item.id) continue

            // Check if product already in user's wishlist
            const { data: existing } = await supabase
                .from('wishlist_items')
                .select('id')
                .eq('user_id', user.id)
                .eq('product_id', item.id)
                .single()

            if (existing) {
                skippedCount++
                continue
            }

            // Add to user's wishlist
            const { error } = await supabase
                .from('wishlist_items')
                .insert({
                    user_id: user.id,
                    product_id: item.id,
                })

            if (error) {
                console.error('Error syncing wishlist item:', error)
                skippedCount++
            } else {
                syncedCount++
            }
        }

        // If we have a guest ID, clean up guest wishlist items
        if (guestId) {
            await supabase
                .from('wishlist_items')
                .delete()
                .eq('guest_id', guestId)
        }

        return NextResponse.json({
            message: 'Wishlist synced successfully',
            syncedCount,
            skippedCount,
        })
    } catch (error) {
        console.error('Wishlist sync error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
