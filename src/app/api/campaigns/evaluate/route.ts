import { NextRequest, NextResponse } from 'next/server'
import { findBestCampaign, findNearestCampaign } from '@/lib/services/campaigns'
import { CartData } from '@/types/database/campaigns'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { cartData } = body as { cartData: CartData }

        console.log('Campaign evaluation request:', {
            itemCount: cartData?.items?.length,
            subtotal: cartData?.subtotal,
            items: cartData?.items?.map(item => ({
                id: item.id,
                product_id: item.product_id,
                quantity: item.quantity,
                price: item.price
            }))
        })

        if (!cartData || !cartData.items) {
            console.error('Invalid cart data received:', cartData)
            return NextResponse.json(
                { error: 'Invalid cart data' },
                { status: 400 }
            )
        }

        // Validate cart data structure
        if (!Array.isArray(cartData.items) || cartData.items.length === 0) {
            console.log('Empty cart, no campaigns to evaluate')
            return NextResponse.json({
                success: true,
                appliedCampaign: null,
                nearestCampaign: null
            })
        }

        const bestCampaign = await findBestCampaign(cartData)
        let nearestCampaign = null

        console.log('Best campaign found:', bestCampaign)

        if (!bestCampaign) {
            nearestCampaign = await findNearestCampaign(cartData)
            console.log('Nearest campaign found:', nearestCampaign)
        }

        return NextResponse.json({
            success: true,
            appliedCampaign: bestCampaign,
            nearestCampaign,
            debug: {
                cartItemCount: cartData.items.length,
                totalQuantity: cartData.items.reduce((sum, item) => sum + item.quantity, 0),
                subtotal: cartData.subtotal
            }
        })
    } catch (error: any) {
        console.error('Campaign evaluation error:', error)
        return NextResponse.json(
            { 
                error: error.message || 'Failed to evaluate campaigns',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        )
    }
}
