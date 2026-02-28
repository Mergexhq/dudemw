import { prisma } from '@/lib/db'
import { CacheService } from '@/lib/services/redis'
import { Banner, BannerCreate, BannerUpdate, BannerFilters, BannerStats, BannerStatus } from '@/lib/types/banners'
import { StorageDeletionService } from '@/lib/services/storage-deletion'

export class BannerService {
  /** Get all banners with filtering (admin panel) */
  static async getBanners(filters?: BannerFilters) {
    try {
      const where: any = {}
      if (filters?.placement && filters.placement !== 'all') where.placement = filters.placement
      if (filters?.status && filters.status !== 'all') where.status = filters.status
      if (filters?.category && filters.category !== 'all') where.category = filters.category

      let banners = await prisma.banners.findMany({
        where,
        orderBy: { position: 'asc' },
      })

      if (filters?.search) {
        const s = filters.search.toLowerCase()
        banners = banners.filter(
          (b: any) =>
            b.internal_title?.toLowerCase().includes(s) || b.action_name?.toLowerCase().includes(s)
        )
      }

      const bannersWithCTR = banners.map((b: any) => ({
        ...b,
        ctr: b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(2) : '0.00',
      })) as Banner[]

      return { success: true, data: bannersWithCTR }
    } catch (error) {
      console.error('Error fetching banners:', error)
      return { success: false, error: 'Failed to fetch banners' }
    }
  }

  /** Get a single banner by ID */
  static async getBanner(id: string) {
    try {
      const data = await prisma.banners.findUnique({ where: { id } })
      if (!data) return { success: false, error: 'Banner not found' }
      return { success: true, data: data as unknown as Banner }
    } catch (error) {
      console.error('Error fetching banner:', error)
      return { success: false, error: 'Failed to fetch banner' }
    }
  }

  /** Create a new banner */
  static async createBanner(input: BannerCreate) {
    try {
      let status: BannerStatus = input.status || 'active'
      if (input.start_date && new Date(input.start_date) > new Date()) status = 'scheduled'

      const data = await prisma.banners.create({
        data: {
          internal_title: input.internal_title,
          image_url: input.image_url || null,
          placement: input.placement,
          action_type: input.action_type || null,
          action_target: input.action_target || null,
          action_name: input.action_name || null,
          start_date: input.start_date ? new Date(input.start_date) : null,
          end_date: input.end_date ? new Date(input.end_date) : null,
          position: input.position || null,
          category: input.category || null,
          cta_text: input.cta_text || null,
          carousel_data: input.carousel_data || null,
          marquee_data: input.marquee_data || null,
          status,
          clicks: 0,
          impressions: 0,
          ctr: 0,
        } as any,
      })

      await CacheService.clearBannerCache()
      return { success: true, data: data as unknown as Banner }
    } catch (error) {
      console.error('Error creating banner:', error)
      return { success: false, error: 'Failed to create banner' }
    }
  }

  /** Update a banner */
  static async updateBanner(id: string, input: BannerUpdate) {
    try {
      const data = await prisma.banners.update({
        where: { id },
        data: { ...input, updated_at: new Date() } as any,
      })
      await CacheService.clearBannerCache()
      return { success: true, data: data as unknown as Banner }
    } catch (error: any) {
      console.error('Error updating banner:', error)
      return { success: false, error: error.message || 'Failed to update banner' }
    }
  }

  /** Delete a banner */
  static async deleteBanner(id: string) {
    try {
      const banner = await prisma.banners.findUnique({
        where: { id },
        select: { image_url: true, carousel_data: true } as any,
      })

      if (banner) {
        StorageDeletionService.deleteBannerImages(banner as any).catch(err =>
          console.error('Failed to cleanup banner images:', err)
        )
      }

      await prisma.banners.delete({ where: { id } })
      await CacheService.clearBannerCache()
      return { success: true }
    } catch (error) {
      console.error('Error deleting banner:', error)
      return { success: false, error: 'Failed to delete banner' }
    }
  }

  /** Toggle banner status (active/disabled) */
  static async toggleBannerStatus(id: string) {
    try {
      const banner = await prisma.banners.findUnique({ where: { id }, select: { status: true } as any })
      if (!banner) return { success: false, error: 'Banner not found' }

      const newStatus = (banner as any).status === 'disabled' ? 'active' : 'disabled'
      const data = await prisma.banners.update({
        where: { id },
        data: { status: newStatus, updated_at: new Date() } as any,
      })

      await CacheService.clearBannerCache()
      return { success: true, data: data as unknown as Banner }
    } catch (error) {
      console.error('Error toggling banner status:', error)
      return { success: false, error: 'Failed to toggle banner status' }
    }
  }

  /** Get banner statistics */
  static async getBannerStats(): Promise<{ success: boolean; data?: BannerStats; error?: string }> {
    try {
      const banners = await prisma.banners.findMany({
        select: { status: true, clicks: true, impressions: true } as any,
      })

      const stats: BannerStats = {
        total: banners.length,
        active: 0,
        scheduled: 0,
        expired: 0,
        disabled: 0,
        totalClicks: 0,
        totalImpressions: 0,
        averageCTR: 0,
      }

        ; (banners as any[]).forEach(b => {
          if (b.status === 'active') stats.active++
          else if (b.status === 'scheduled') stats.scheduled++
          else if (b.status === 'expired') stats.expired++
          else if (b.status === 'disabled') stats.disabled++
          stats.totalClicks += b.clicks || 0
          stats.totalImpressions += b.impressions || 0
        })

      if (stats.totalImpressions > 0) {
        stats.averageCTR = (stats.totalClicks / stats.totalImpressions) * 100
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error fetching banner stats:', error)
      return { success: false, error: 'Failed to fetch banner statistics' }
    }
  }

  /** Track banner impression — Prisma atomic increment */
  static async trackImpression(bannerId: string) {
    try {
      await prisma.banners.update({
        where: { id: bannerId },
        data: { impressions: { increment: 1 } } as any,
      })
      return { success: true }
    } catch {
      return { success: true } // don't fail request on analytics error
    }
  }

  /** Track banner click */
  static async trackClick(bannerId: string) {
    try {
      await prisma.banners.update({
        where: { id: bannerId },
        data: { clicks: { increment: 1 } } as any,
      })
      return { success: true }
    } catch {
      return { success: true }
    }
  }

  /** Get active banners for store display by placement */
  static async getActiveBanners(placement?: string) {
    try {
      const now = new Date()
      const data = await prisma.banners.findMany({
        where: {
          status: 'active',
          ...(placement && { placement }),
          AND: [
            { OR: [{ start_date: null }, { start_date: { lte: now } }] },
            { OR: [{ end_date: null }, { end_date: { gte: now } }] },
          ],
        } as any,
        orderBy: { position: 'asc' },
      })
      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching active banners:', error)
      return { success: false, error: 'Failed to fetch active banners' }
    }
  }

  /**
   * Upload banner image — delegated to Cloudinary via server action
   * (Supabase Storage is no longer used)
   */
  static async uploadBannerImage(file: File, bannerId?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { uploadImageAction } = await import('@/app/actions/media')
      const result = await uploadImageAction(formData, 'banners')
      if (!result.success) return { success: false, error: result.error || 'Failed to upload' }
      return { success: true, url: result.url }
    } catch (error) {
      return { success: false, error: 'Failed to upload banner image' }
    }
  }
}
