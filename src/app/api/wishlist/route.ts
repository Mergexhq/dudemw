import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getOrCreateGuestId } from '@/lib/utils/guest'
import { cookies } from 'next/headers'

/**
 * GET /api/wishlist
 * Fetch wishlist items for authenticated user or guest
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabase()

        // Check if user is authenticated
        const { data: { user } } = await supabase.auth.getUser()

        let query = supabase
            .from('wishlist_items')
            .select(`
        id,
        product_id,
        variant_id,
        created_at,
        products (
          id,
          title,
          slug,
          price,
          original_price,
          compare_price,
          images,
          description,
          in_stock
        ),
        product_variants (
          id,
          name,
          price,
          discount_price,
          sku,
          image_url,
          variant_images (
            image_url
          )
        )
      `)

        if (user) {
            // Authenticated user - fetch by user_id
            query = query.eq('user_id', user.id)
        } else {
            // Guest user - fetch by guest_id from cookie
            const cookieStore = await cookies()
            const guestIdCookie = cookieStore.get('guest_id')
            const guestId = guestIdCookie?.value

            if (!guestId) {
                return NextResponse.json({ items: [] })
            }

            query = query.eq('guest_id', guestId)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching wishlist:', error)
            return NextResponse.json(
                { error: 'Failed to fetch wishlist' },
                { status: 500 }
            )
        }

        console.log('✅ Wishlist GET - Returning items:', data?.length || 0)
        console.log('✅ Items:', data)

        return NextResponse.json({ items: data || [] })
    } catch (error) {
        console.error('Wishlist GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/wishlist
 * Add product to wishlist
 */
export async function POST(request: NextRequest) {
    try {
        const { productId, variantId } = await request.json()

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            )
        }

        const supabase = await createServerSupabase()
        const { data: { user } } = await supabase.auth.getUser()

        let insertData: any = {
            product_id: productId,
            variant_id: variantId || null,
        }

        if (user) {
            insertData.user_id = user.id
        } else {
            // Get or create guest ID
            const cookieStore = await cookies()
            const guestIdCookie = cookieStore.get('guest_id')
            let guestId = guestIdCookie?.value

            if (!guestId) {
                guestId = getOrCreateGuestId()
                // Note: Cookie will be set by client-side code
            }

            insertData.guest_id = guestId
        }

        // Check if item already exists (same product AND variant)
        let existsQuery = supabase
            .from('wishlist_items')
            .select('id')
            .eq('product_id', productId)

        // Check variant match - both null or both same value
        if (variantId) {
            existsQuery = existsQuery.eq('variant_id', variantId)
        } else {
            existsQuery = existsQuery.is('variant_id', null)
        }

        if (user) {
            existsQuery = existsQuery.eq('user_id', user.id)
        } else {
            existsQuery = existsQuery.eq('guest_id', insertData.guest_id)
        }

        const { data: existing } = await existsQuery.single()

        if (existing) {
            return NextResponse.json(
                { message: 'Product already in wishlist', item: existing },
                { status: 200 }
            )
        }

        // Insert new wishlist item
        const { data, error } = await supabase
            .from('wishlist_items')
            .insert(insertData)
            .select()
            .single()

        if (error) {
            console.error('Error adding to wishlist:', error)
            return NextResponse.json(
                { error: 'Failed to add to wishlist' },
                { status: 500 }
            )
        }

        return NextResponse.json({ item: data }, { status: 201 })
    } catch (error) {
        console.error('Wishlist POST error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/wishlist
 * Remove product from wishlist
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')
        const variantId = searchParams.get('variantId')

        if (!productId) {
            return NextResponse.json(
                { error: 'Product ID is required' },
                { status: 400 }
            )
        }

        const supabase = await createServerSupabase()
        const { data: { user } } = await supabase.auth.getUser()

        let deleteQuery = supabase
            .from('wishlist_items')
            .delete()
            .eq('product_id', productId)

        // Match variant - both null or both same value
        if (variantId && variantId !== 'null' && variantId !== 'undefined') {
            deleteQuery = deleteQuery.eq('variant_id', variantId)
        } else {
            deleteQuery = deleteQuery.is('variant_id', null)
        }

        if (user) {
            deleteQuery = deleteQuery.eq('user_id', user.id)
        } else {
            // Get guest ID from cookie
            const cookieStore = await cookies()
            const guestIdCookie = cookieStore.get('guest_id')
            const guestId = guestIdCookie?.value

            if (!guestId) {
                console.error('DELETE - No guest ID found in cookies')
                console.error('Available cookies:', cookieStore.getAll().map(c => c.name))
                return NextResponse.json(
                    { error: 'Guest ID not found. Please refresh the page and try again.' },
                    { status: 400 }
                )
            }

            console.log('DELETE - Using guest_id:', guestId)
            deleteQuery = deleteQuery.eq('guest_id', guestId)
        }

        const { error } = await deleteQuery

        if (error) {
            console.error('Error removing from wishlist:', error)
            return NextResponse.json(
                { error: 'Failed to remove from wishlist' },
                { status: 500 }
            )
        }

        return NextResponse.json({ message: 'Removed from wishlist' })
    } catch (error) {
        console.error('Wishlist DELETE error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
