'use server'

import prisma from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function updateProductColorOption(productId: string, colorName: string) {
    try {
        // 1. Query existing product options with their values
        const existingOptions = await prisma.product_options.findMany({
            where: { product_id: productId },
            include: { product_option_values: true }
        })

        // 2. Find the "Color" option (case-insensitive)
        const colorOption = existingOptions.find(
            opt => opt.name.toLowerCase() === 'color'
        )

        let colorOptionId: string

        if (colorOption) {
            colorOptionId = colorOption.id

            if (colorOption.product_option_values.length > 0) {
                // Update the first color value
                const existingValue = colorOption.product_option_values[0]
                await prisma.product_option_values.update({
                    where: { id: existingValue.id },
                    data: { name: colorName, hex_color: '#000000' }
                })
            } else {
                // No values exist, create one
                await prisma.product_option_values.create({
                    data: {
                        option_id: colorOptionId,
                        name: colorName,
                        hex_color: '#000000',
                        position: 0
                    }
                })
            }
        } else {
            // Color option doesn't exist, create it
            const newOption = await prisma.product_options.create({
                data: {
                    product_id: productId,
                    name: 'Color',
                    position: 0
                }
            })

            colorOptionId = newOption.id

            await prisma.product_option_values.create({
                data: {
                    option_id: colorOptionId,
                    name: colorName,
                    hex_color: '#000000',
                    position: 0
                }
            })
        }

        revalidatePath('/admin/products')
        revalidatePath('/products')

        return { success: true }
    } catch (error) {
        console.error('Error updating product color:', error)
        return { success: false, error: 'Internal server error' }
    }
}
