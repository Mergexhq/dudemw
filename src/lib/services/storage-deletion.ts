import { deleteFromCloudinary } from '@/lib/cloudinary'

/**
 * Storage deletion utility service
 * Handles deletion of images from Cloudinary
 */
export class StorageDeletionService {
    /**
     * Delete a single image from storage
     */
    static async deleteImage(imageUrl: string | null | undefined, bucket?: string): Promise<{ success: boolean; error?: string }> {
        if (!imageUrl) {
            return { success: true } // Nothing to delete
        }

        try {
            // Only process Cloudinary URLs
            if (imageUrl.includes('res.cloudinary.com')) {
                // Try to extract public ID from Cloudinary URL
                // Format is typically: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<folder>/<filename>.<ext>
                const parts = imageUrl.split('/');
                const filenameWithExt = parts[parts.length - 1];
                const folder = parts[parts.length - 2];
                if (filenameWithExt && folder && folder !== 'upload' && !folder.startsWith('v')) {
                    const filename = filenameWithExt.split('.')[0];
                    const publicId = `${folder}/${filename}`;
                    return await deleteFromCloudinary(publicId)
                }

                // Fallback basic extraction if it's just the filename
                const basicFilename = filenameWithExt.split('.')[0];
                return await deleteFromCloudinary(basicFilename);
            }

            // Silently ignore non-Cloudinary URLs
            return { success: true }
        } catch (error: any) {
            console.error('Error in deleteImage:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Delete multiple images from storage
     */
    static async deleteImages(imageUrls: (string | null | undefined)[], bucket?: string): Promise<{ success: boolean; error?: string }> {
        const validUrls = imageUrls.filter((url): url is string => !!url)

        if (validUrls.length === 0) {
            return { success: true } // Nothing to delete
        }

        try {
            const results = await Promise.all(
                validUrls.map(url => this.deleteImage(url, bucket))
            )

            const failures = results.filter(r => !r.success)
            if (failures.length > 0) {
                return { success: false, error: `Failed to delete ${failures.length} images` }
            }

            return { success: true }
        } catch (error: any) {
            console.error('Error in deleteImages:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Delete banner images (including carousel images)
     */
    static async deleteBannerImages(banner: {
        image_url?: string | null
        carousel_data?: any
    }): Promise<{ success: boolean; error?: string }> {
        const imageUrls: string[] = []

        // Add main image
        if (banner.image_url) {
            imageUrls.push(banner.image_url)
        }

        // Add carousel images
        if (banner.carousel_data) {
            try {
                const carouselItems = typeof banner.carousel_data === 'string'
                    ? JSON.parse(banner.carousel_data)
                    : banner.carousel_data

                if (Array.isArray(carouselItems)) {
                    carouselItems.forEach((item: any) => {
                        if (item.image_url) imageUrls.push(item.image_url)
                        if (item.imageUrl) imageUrls.push(item.imageUrl)
                    })
                }
            } catch (error) {
                console.error('Error parsing carousel_data:', error)
            }
        }

        return this.deleteImages(imageUrls, 'banners')
    }

    /**
     * Delete product images (including variants)
     */
    static async deleteProductImages(product: {
        thumbnail_url?: string | null
        images?: any
    }): Promise<{ success: boolean; error?: string }> {
        const imageUrls: string[] = []

        // Add thumbnail
        if (product.thumbnail_url) {
            imageUrls.push(product.thumbnail_url)
        }

        // Add product images
        if (product.images) {
            try {
                const images = Array.isArray(product.images) ? product.images : [product.images]
                images.forEach((img: any) => {
                    if (typeof img === 'string') {
                        imageUrls.push(img)
                    } else if (img?.url) {
                        imageUrls.push(img.url)
                    }
                })
            } catch (error) {
                console.error('Error parsing product images:', error)
            }
        }

        return this.deleteImages(imageUrls, 'products')
    }

    /**
     * Delete category images
     */
    static async deleteCategoryImages(category: {
        image_url?: string | null
        homepage_thumbnail_url?: string | null
        plp_square_thumbnail_url?: string | null
    }): Promise<{ success: boolean; error?: string }> {
        const imageUrls: string[] = []

        if (category.image_url) imageUrls.push(category.image_url)
        if (category.homepage_thumbnail_url) imageUrls.push(category.homepage_thumbnail_url)
        if (category.plp_square_thumbnail_url) imageUrls.push(category.plp_square_thumbnail_url)

        return this.deleteImages(imageUrls, 'categories')
    }

    /**
     * Delete collection images
     */
    static async deleteCollectionImages(collection: {
        image_url?: string | null
    }): Promise<{ success: boolean; error?: string }> {
        return this.deleteImage(collection.image_url, 'collections')
    }
}
