'use server'

import { createServerSupabase } from '@/lib/supabase/server'

export interface ProductSearchResult {
    id: string
    title: string
    slug: string | null
    product_family_id: string | null
}

export async function searchProducts(
    query: string,
    excludeProductId?: string
): Promise<{
    success: boolean
    data?: ProductSearchResult[]
    error?: string
}> {
    try {
        const supabase = await createServerSupabase()

        if (!query || query.trim().length === 0) {
            return { success: true, data: [] }
        }

        let queryBuilder = supabase
            .from('products')
            .select('id, title, slug, product_family_id')
            .eq('status', 'published')
            .ilike('title', `%${query.trim()}%`)
            .order('title')
            .limit(50)

        // Exclude current product if specified
        if (excludeProductId) {
            queryBuilder = queryBuilder.neq('id', excludeProductId)
        }

        const { data, error } = await queryBuilder

        if (error) {
            console.error('Error searching products:', error)
            return {
                success: false,
                error: 'Failed to search products'
            }
        }

        return {
            success: true,
            data: data || []
        }
    } catch (error) {
        console.error('Error in searchProducts:', error)
        return {
            success: false,
            error: 'An unexpected error occurred'
        }
    }
}
