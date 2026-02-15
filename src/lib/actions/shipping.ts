'use server'

import { calculateShippingCost } from '@/lib/services/shipping-calculation'

export async function getShippingCostAction(itemCount: number, state?: string) {
    try {
        return await calculateShippingCost(itemCount, state)
    } catch (error) {
        console.error('Error in getShippingCostAction:', error)
        return { cost: 99, provider: 'Standard', isFree: false }
    }
}
