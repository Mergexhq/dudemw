import { NextRequest, NextResponse } from 'next/server'
import { CacheService } from '@/lib/services/redis'

/**
 * GET /api/admin/cache
 * Check cache status
 */
export async function GET() {
    try {
        const isAvailable = CacheService.isAvailable()

        return NextResponse.json({
            success: true,
            data: {
                available: isAvailable,
                message: isAvailable
                    ? 'Redis cache is connected and operational'
                    : 'Redis cache is not configured or unavailable'
            }
        })
    } catch (error) {
        console.error('Error checking cache status:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to check cache status' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/admin/cache
 * Clear cache by type
 * Query params:
 *  - type: 'all' | 'products' | 'collections' | 'categories' | 'banners' | 'homepage'
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'all'

        switch (type) {
            case 'products':
                await CacheService.clearProductCache()
                break
            case 'collections':
                await CacheService.clearCollectionCache()
                break
            case 'categories':
                await CacheService.clearCategoryCache()
                break
            case 'banners':
                await CacheService.clearBannerCache()
                break
            case 'homepage':
                await CacheService.clearHomepageCache()
                break
            case 'all':
            default:
                await CacheService.clearAllCache()
                break
        }

        return NextResponse.json({
            success: true,
            data: {
                cleared: type,
                message: `${type === 'all' ? 'All caches' : `${type} cache`} cleared successfully`
            }
        })
    } catch (error) {
        console.error('Error clearing cache:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to clear cache' },
            { status: 500 }
        )
    }
}
