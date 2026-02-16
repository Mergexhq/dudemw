'use server'

import { supabaseAdmin } from '@/lib/supabase/supabase'
import { revalidatePath } from 'next/cache'

export async function updateProductColorOption(productId: string, colorName: string) {
    try {
        // 1. Fetch current product options
        const { data: product, error: fetchError } = await supabaseAdmin
            .from('products')
            .select('options')
            .eq('id', productId)
            .single()

        if (fetchError || !product) {
            return { success: false, error: 'Product not found' }
        }

        let options = product.options as any[] || []

        // 2. Find "Color" option (case-insensitive)
        const colorOptionIndex = options.findIndex((opt: any) => opt.name.toLowerCase() === 'color')

        if (colorOptionIndex >= 0) {
            // Update existing "Color" option
            // We overwrite values to ensure it only has this specific color for this product/variant
            options[colorOptionIndex].values = [{
                id: options[colorOptionIndex].values[0]?.id || crypto.randomUUID(),
                name: colorName,
                hexColor: '#000000'
            }]
        } else {
            // Create new "Color" option
            options.push({
                id: crypto.randomUUID(),
                name: 'Color',
                values: [{ id: crypto.randomUUID(), name: colorName, hexColor: '#000000' }]
            })
        }

        // 3. Update product
        const { error: updateError } = await supabaseAdmin
            .from('products')
            .update({ options })
            .eq('id', productId)

        if (updateError) {
            return { success: false, error: updateError.message }
        }

        revalidatePath('/admin/products')
        revalidatePath(`/products`)

        return { success: true }

    } catch (error) {
        console.error('Error updating product color:', error)
        return { success: false, error: 'Internal server error' }
    }
}
