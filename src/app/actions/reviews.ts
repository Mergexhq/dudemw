'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function submitReview(formData: FormData) {
    try {
        const name = formData.get('name') as string
        const rating = parseInt(formData.get('rating') as string)
        const comment = formData.get('comment') as string
        const productId = formData.get('productId') as string
        const imagesString = formData.get('images') as string | null
        const images = imagesString ? JSON.parse(imagesString) : []

        if (!name || !rating || !comment || !productId) {
            return { success: false, message: 'All fields are required' }
        }

        await prisma.product_reviews.create({
            data: {
                product_id: productId,
                reviewer_name: name,
                rating,
                comment,
                images,
                status: 'approved',
                verified_purchase: false,
                helpful_count: 0,
            } as any,
        })

        revalidatePath('/products', 'layout')
        revalidatePath('/', 'layout')

        return { success: true, message: 'Thank you for your review!' }
    } catch (error) {
        console.error('Server action error:', error)
        return { success: false, message: 'An unexpected error occurred.' }
    }
}

export async function getProductReviews(productId: string) {
    try {
        const reviews = await prisma.product_reviews.findMany({
            where: { product_id: productId, status: 'approved' } as any,
            orderBy: { created_at: 'desc' } as any,
        })

        return { success: true, data: reviews }
    } catch (error) {
        console.error('Error fetching reviews:', error)
        return { success: false, data: [] }
    }
}
