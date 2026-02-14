'use server'

import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'

/**
 * Server Action for uploading images to Cloudinary
 * Keeps API credentials secure on the server side
 */
type CloudinaryFolder = 'products' | 'categories' | 'banners' | 'avatars'

export async function uploadImageAction(
    formData: FormData,
    folder: CloudinaryFolder = 'products'
) {
    try {
        const file = formData.get('file') as File

        if (!file) {
            return { success: false, error: 'No file provided' }
        }

        // Convert file to buffer for Cloudinary
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Upload to Cloudinary
        const result = await uploadToCloudinary(buffer, folder)

        if (!result.success) {
            return { success: false, error: result.error || 'Upload failed' }
        }

        return {
            success: true,
            url: result.url,
            publicId: result.publicId,
            width: result.width,
            height: result.height,
        }
    } catch (error) {
        console.error('Error in uploadImageAction:', error)
        return { success: false, error: 'Failed to upload image' }
    }
}

/**
 * Server Action for deleting images from Cloudinary
 */
export async function deleteImageAction(publicId: string) {
    try {
        if (!publicId) {
            return { success: false, error: 'No public ID provided' }
        }

        const result = await deleteFromCloudinary(publicId)
        return result
    } catch (error) {
        console.error('Error in deleteImageAction:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed',
        }
    }
}
