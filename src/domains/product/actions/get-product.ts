'use server'

import { ProductService } from '@/lib/services/products'
import { Product } from '@/domains/product'

export async function getProduct(id: string): Promise<Product | null> {
    try {
        const result = await ProductService.getProduct(id)
        if (result.success && result.data) {
            return result.data as Product
        }
        return null
    } catch (error) {
        console.error('Error fetching product:', error)
        return null
    }
}
