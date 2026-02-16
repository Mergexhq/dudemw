'use server'

import { supabaseAdmin } from '@/lib/supabase/supabase'
import { revalidatePath } from 'next/cache'

export async function updateProductColorOption(productId: string, colorName: string) {
    try {
        // 1. Query existing product options with their values
        const { data: existingOptions, error: fetchError } = await supabaseAdmin
            .from('product_options')
            .select(`
                id,
                name,
                product_option_values (
                    id,
                    name,
                    hex_color
                )
            `)
            .eq('product_id', productId)

        if (fetchError) {
            console.error('Error fetching product options:', fetchError)
            return { success: false, error: 'Failed to fetch product options' }
        }

        // 2. Find the "Color" option (case-insensitive)
        const colorOption = existingOptions?.find(
            (opt: any) => opt.name.toLowerCase() === 'color'
        )

        let colorOptionId: string

        if (colorOption) {
            // Color option exists, use its ID
            colorOptionId = colorOption.id

            // Update the existing color value or create a new one
            if (colorOption.product_option_values && colorOption.product_option_values.length > 0) {
                // Update the first color value
                const existingValue = colorOption.product_option_values[0]
                const { error: updateError } = await supabaseAdmin
                    .from('product_option_values')
                    .update({
                        name: colorName,
                        hex_color: '#000000'
                    })
                    .eq('id', existingValue.id)

                if (updateError) {
                    console.error('Error updating color value:', updateError)
                    return { success: false, error: updateError.message }
                }
            } else {
                // No values exist, create one
                const { error: insertError } = await supabaseAdmin
                    .from('product_option_values')
                    .insert({
                        option_id: colorOptionId,
                        name: colorName,
                        hex_color: '#000000',
                        position: 0
                    })

                if (insertError) {
                    console.error('Error creating color value:', insertError)
                    return { success: false, error: insertError.message }
                }
            }
        } else {
            // Color option doesn't exist, create it
            const { data: newOption, error: createOptionError } = await supabaseAdmin
                .from('product_options')
                .insert({
                    product_id: productId,
                    name: 'Color',
                    position: 0
                })
                .select()
                .single()

            if (createOptionError || !newOption) {
                console.error('Error creating color option:', createOptionError)
                return { success: false, error: createOptionError?.message || 'Failed to create option' }
            }

            colorOptionId = newOption.id

            // Create the color value
            const { error: insertValueError } = await supabaseAdmin
                .from('product_option_values')
                .insert({
                    option_id: colorOptionId,
                    name: colorName,
                    hex_color: '#000000',
                    position: 0
                })

            if (insertValueError) {
                console.error('Error creating color value:', insertValueError)
                return { success: false, error: insertValueError.message }
            }
        }

        revalidatePath('/admin/products')
        revalidatePath(`/products`)

        return { success: true }

    } catch (error) {
        console.error('Error updating product color:', error)
        return { success: false, error: 'Internal server error' }
    }
}
