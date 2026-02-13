import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

type CloudinaryFolder = 'products' | 'categories' | 'banners' | 'avatars'

/**
 * Upload an image to Cloudinary with folder organization
 * @param file - File buffer or base64 string
 * @param folder - Cloudinary folder ('banners', 'products', 'categories')
 * @param publicId - Optional custom public ID
 * @returns Cloudinary upload result with secure_url
 */
export async function uploadToCloudinary(
    file: Buffer | string,
    folder: CloudinaryFolder,
    publicId?: string
) {
    try {
        const result = await cloudinary.uploader.upload(
            file instanceof Buffer ? `data:image/jpeg;base64,${file.toString('base64')}` : file,
            {
                folder: `dudemenswear/${folder}`,
                public_id: publicId,
                resource_type: 'image',
                transformation: [
                    { quality: 'auto', fetch_format: 'auto' }
                ]
            }
        )

        return {
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
        }
    } catch (error) {
        console.error('Cloudinary upload error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        }
    }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Deletion result
 */
export async function deleteFromCloudinary(publicId: string) {
    try {
        const result = await cloudinary.uploader.destroy(publicId)
        return {
            success: result.result === 'ok',
            result: result.result,
        }
    } catch (error) {
        console.error('Cloudinary delete error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed',
        }
    }
}

/**
 * Get optimized Cloudinary URL for an image
 * @param publicId - The public ID of the image
 * @param transformations - Optional transformations
 * @returns Optimized URL
 */
export function getCloudinaryUrl(
    publicId: string,
    transformations?: {
        width?: number
        height?: number
        crop?: string
        quality?: string | number
    }
) {
    return cloudinary.url(publicId, {
        secure: true,
        ...transformations,
    })
}
