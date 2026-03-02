'use server'

import { prisma } from '@/lib/db'
import { getCached, CacheTTL } from '@/lib/cache/server-cache'
import { uploadToCloudinary } from '@/lib/cloudinary'

// Image upload function
export async function uploadProductImage(formData: FormData): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const file = formData.get('file') as File

        if (!file) {
            throw new Error('No file provided')
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Cloudinary under the 'products' folder
        const uploadResult = await uploadToCloudinary(buffer, 'products')

        if (!uploadResult.success || !uploadResult.url) {
            throw new Error(uploadResult.error || 'Failed to upload to Cloudinary')
        }

        return { success: true, url: uploadResult.url }
    } catch (error) {
        console.error('Error uploading image:', error)
        return { success: false, error: 'Failed to upload image' }
    }
}

// Helper functions for dropdowns
export async function getCategories() {
    return getCached('categories:all', async () => {
        try {
            const data = await prisma.categories.findMany({
                select: { id: true, name: true, slug: true },
                orderBy: { name: 'asc' }
            })
            return { success: true, data }
        } catch (error) {
            console.error('Error fetching categories', error)
            return { success: false, error: 'Failed to fetch categories' }
        }
    }, CacheTTL.CATEGORY) // 15 minute cache
}

export async function getCollections() {
    return getCached('collections:all', async () => {
        try {
            const data = await prisma.collections.findMany({
                where: { is_active: true },
                select: { id: true, title: true, slug: true, type: true },
                orderBy: { title: 'asc' }
            })

            return { success: true, data }
        } catch (error) {
            console.error('Error fetching collections:', error)
            return { success: false, error: 'Failed to fetch collections' }
        }
    }, CacheTTL.COLLECTION) // 10 minute cache
}

export async function getTags() {
    try {
        const data = await prisma.product_tags.findMany({
            select: { id: true, name: true, slug: true },
            orderBy: { name: 'asc' }
        })

        return { success: true, data }
    } catch (error) {
        console.error('Error fetching tags:', error)
        return { success: false, error: 'Failed to fetch tags' }
    }
}
