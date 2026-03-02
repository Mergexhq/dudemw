'use server'

import { BannerService } from '@/lib/services/banners'
import { serializePrisma } from '@/lib/utils/prisma-utils'

export async function getActiveMarqueeBanner() {
    try {
        const result = await BannerService.getActiveBanners('top-marquee-banner')
        if (result.success && result.data && result.data.length > 0) {
            return serializePrisma(result.data[0])
        }
        return null
    } catch (error) {
        console.error('Failed to get active marquee banner', error)
        return null
    }
}

export async function getActiveBannersAction(placement: string) {
    try {
        const result = await BannerService.getActiveBanners(placement)
        return { success: true, data: serializePrisma(result.data || []) }
    } catch (error) {
        console.error('Failed to get active banners:', error)
        return { success: false, data: [] }
    }
}

export async function getCategoryBannerAction(category: string) {
    try {
        const result = await BannerService.getActiveBanners('category-banner')
        const banner = result.data?.find((b: any) => b.category === category)
        return { success: true, data: serializePrisma(banner || null) }
    } catch (error) {
        console.error('Failed to get category banner:', error)
        return { success: false, data: null }
    }
}
