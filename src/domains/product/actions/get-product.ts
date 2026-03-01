'use server'

import { getProduct as getProductAction } from '@/lib/actions/products'
import { Product } from '@/domains/product'

export async function getProduct(id: string): Promise<Product | null> {
    try {
        const result = await getProductAction(id)
        if (result.success && result.data) {
            return result.data as Product
        }
        return null
    } catch (error) {
        console.error('Error fetching product:', error)
        return null
    }
}
