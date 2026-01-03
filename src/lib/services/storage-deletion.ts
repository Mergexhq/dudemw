import { createClient } from '@/lib/supabase/client'

/**
 * Storage deletion utility service
 * Handles deletion of images from Supabase storage buckets
 */
export class StorageDeletionService {
    /**
     * Extract file path from Supabase storage URL
     */
    private static extractFilePath(url: string, bucket: string): string | null {
        try {
            // Handle both public and authenticated URLs
            const bucketPattern = new RegExp(`/${bucket}/(.+)$`)
            const match = url.match(bucketPattern)
            return match ? match[1] : null
        } catch (error) {
            console.error('Error extracting file path:', error)
            return null
        }
    }

    /**
     * Delete a single image from storage
     */
    static async deleteImage(imageUrl: string | null | undefined, bucket: string): Promise<{ success: boolean; error?: string }> {
        if (!imageUrl) {
            return { success: true } // Nothing to delete
        }

        try {
            const filePath = this.extractFilePath(imageUrl, bucket)
            if (!filePath) {
                console.warn(`Could not extract file path from URL: ${imageUrl}`)
                return { success: true } // Don't fail the operation
            }

            const supabase = createClient()
            const { error } = await supabase.storage
                .from(bucket)
                .remove([filePath])

            if (error) {
                console.error(`Error deleting image from ${bucket}:`, error)
                return { success: false, error: error.message }
            }

            return { success: true }
        } catch (error: any) {
            console.error('Error in deleteImage:', error)
            return { success: false, error: error.message }
        }
    }

    /**
     * Delete multiple images from storage
     */
    static async deleteImages(imageUrls: (string | null | undefined)[], bucket: string): Promise<{ success: boolean; error?: string }> {
        const validUrls = imageUrls.filter((url): url is string => !!url)

        if (validUrls.length === 0) {
            return { success: true } // Nothing to delete
        }

        try {
            const filePaths = validUrls
                .map(url => this.extractFilePath(url, bucket))
                .filter((path): path is string => !!path)

            if (filePaths.length === 0) {
                return { success: true } // No valid paths
            }

            const supabase = createClient()
            const { error } = await supabase.storage
                .from(bucket)
                .remove(filePaths)

            if (error) {
                console.error(`Error deleting images from ${bucket}:`, error)
                return { success: false, error: error.message }
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
