import { supabaseAdmin } from '@/lib/supabase/supabase'
import { createClient } from '@/lib/supabase/client'
import { CacheService } from '@/lib/services/redis'
import {
  Banner,
  BannerCreate,
  BannerUpdate,
  BannerFilters,
  BannerStats,
  BannerStatus,
} from '@/lib/types/banners'

// Helper to get appropriate client - use client-side supabase for browser, admin for server
const getSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    return createClient()
  }
  return supabaseAdmin
}

export class BannerService {
  /**
   * Get all banners with filtering
   */
  static async getBanners(filters?: BannerFilters) {
    try {
      const supabase = getSupabaseClient()
      let query = supabase
        .from('banners')
        .select('*')
        .order('position', { ascending: true })

      // Apply filters (except status - we'll apply that after recalculation)
      if (filters?.placement && filters.placement !== 'all') {
        query = query.eq('placement', filters.placement)
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category)
      }

      const { data, error } = await query

      if (error) throw error

      // Apply search filter in memory (for internal_title and action_name)
      let filteredData = data || []
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(
          (banner: any) =>
            banner.internal_title?.toLowerCase().includes(searchLower) ||
            banner.action_name?.toLowerCase().includes(searchLower)
        )
      }

      // Update status based on schedule
      const bannersWithStatus = filteredData.map((banner: any) => {
        const now = new Date()
        const startDate = banner.start_date ? new Date(banner.start_date) : null
        const endDate = banner.end_date ? new Date(banner.end_date) : null

        let status = banner.status

        // Auto-update status based on dates
        if (status !== 'disabled') {
          if (startDate && startDate > now) {
            status = 'scheduled'
          } else if (endDate && endDate < now) {
            status = 'expired'
          } else if (startDate && startDate <= now && (!endDate || endDate >= now)) {
            status = 'active'
          }
        }

        return {
          ...banner,
          status,
          ctr: banner.impressions > 0
            ? ((banner.clicks / banner.impressions) * 100).toFixed(2)
            : '0.00'
        } as Banner
      })

      // Apply status filter AFTER recalculating status based on dates
      let finalData = bannersWithStatus
      if (filters?.status && filters.status !== 'all') {
        finalData = bannersWithStatus.filter((banner: Banner) => banner.status === filters.status)
      }

      return {
        success: true,
        data: finalData,
      }
    } catch (error) {
      console.error('Error fetching banners:', error)
      return { success: false, error: 'Failed to fetch banners' }
    }
  }

  /**
   * Get a single banner by ID
   */
  static async getBanner(id: string) {
    try {
      const supabase = getSupabaseClient()
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data: data as Banner }
    } catch (error) {
      console.error('Error fetching banner:', error)
      return { success: false, error: 'Failed to fetch banner' }
    }
  }

  /**
   * Create a new banner
   */
  static async createBanner(input: BannerCreate) {
    try {
      // Set default status based on scheduling
      let status: BannerStatus = input.status || 'active'

      if (input.start_date) {
        const startDate = new Date(input.start_date)
        const now = new Date()
        if (startDate > now) {
          status = 'scheduled'
        }
      }

      const bannerData = {
        internal_title: input.internal_title,
        image_url: input.image_url || null,
        placement: input.placement,
        action_type: input.action_type || null,
        action_target: input.action_target || null,
        action_name: input.action_name || null,
        start_date: input.start_date || null,
        end_date: input.end_date || null,
        position: input.position || null,
        category: input.category || null,
        cta_text: input.cta_text || null,
        carousel_data: input.carousel_data || null,
        marquee_data: input.marquee_data || null,
        status,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabaseAdmin
        .from('banners')
        .insert(bannerData)
        .select()
        .single()

      if (error) throw error

      // Clear banner cache
      await CacheService.clearBannerCache()

      return { success: true, data: data as Banner }
    } catch (error) {
      console.error('Error creating banner:', error)
      return { success: false, error: 'Failed to create banner' }
    }
  }

  /**
   * Update a banner
   */
  static async updateBanner(id: string, input: BannerUpdate) {
    try {
      const supabase = getSupabaseClient()
      const updateData = {
        ...input,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from('banners')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Clear banner cache
      await CacheService.clearBannerCache()

      return { success: true, data: data as Banner }
    } catch (error: any) {
      console.error('Error updating banner:', error)
      return { success: false, error: error.message || 'Failed to update banner' }
    }
  }

  /**
   * Delete a banner
   */
  static async deleteBanner(id: string) {
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Clear banner cache
      await CacheService.clearBannerCache()

      return { success: true }
    } catch (error) {
      console.error('Error deleting banner:', error)
      return { success: false, error: 'Failed to delete banner' }
    }
  }

  /**
   * Toggle banner status (active/disabled)
   */
  static async toggleBannerStatus(id: string) {
    try {
      // Get current banner
      const { data: banner, error: fetchError } = await supabaseAdmin
        .from('banners')
        .select('status')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Toggle status
      const newStatus = banner.status === 'disabled' ? 'active' : 'disabled'

      const { data, error } = await supabaseAdmin
        .from('banners')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Clear banner cache
      await CacheService.clearBannerCache()

      return { success: true, data: data as Banner }
    } catch (error) {
      console.error('Error toggling banner status:', error)
      return { success: false, error: 'Failed to toggle banner status' }
    }
  }

  /**
   * Get banner statistics
   */
  static async getBannerStats(): Promise<{ success: boolean; data?: BannerStats; error?: string }> {
    try {
      const { data: banners, error } = await supabaseAdmin
        .from('banners')
        .select('status, clicks, impressions')

      if (error) throw error

      const stats: BannerStats = {
        total: banners?.length || 0,
        active: 0,
        scheduled: 0,
        expired: 0,
        disabled: 0,
        totalClicks: 0,
        totalImpressions: 0,
        averageCTR: 0,
      }

      banners?.forEach((banner: any) => {
        // Count by status
        switch (banner.status) {
          case 'active':
            stats.active++
            break
          case 'scheduled':
            stats.scheduled++
            break
          case 'expired':
            stats.expired++
            break
          case 'disabled':
            stats.disabled++
            break
        }

        // Sum analytics
        stats.totalClicks += banner.clicks || 0
        stats.totalImpressions += banner.impressions || 0
      })

      // Calculate average CTR
      if (stats.totalImpressions > 0) {
        stats.averageCTR = (stats.totalClicks / stats.totalImpressions) * 100
      }

      return { success: true, data: stats }
    } catch (error) {
      console.error('Error fetching banner stats:', error)
      return { success: false, error: 'Failed to fetch banner statistics' }
    }
  }

  /**
   * Track banner impression
   */
  static async trackImpression(bannerId: string) {
    try {
      // Using type assertion for unregistered RPC function
      const { error } = await (supabaseAdmin as any)
        .rpc('increment_banner_impressions', { banner_id: bannerId })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error tracking impression:', error)
      // Don't fail the request if analytics tracking fails
      return { success: true }
    }
  }

  /**
   * Track banner click
   */
  static async trackClick(bannerId: string) {
    try {
      // Using type assertion for unregistered RPC function
      const { error } = await (supabaseAdmin as any)
        .rpc('increment_banner_clicks', { banner_id: bannerId })

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error tracking click:', error)
      // Don't fail the request if analytics tracking fails
      return { success: true }
    }
  }

  /**
   * Upload banner image to Supabase Storage
   */
  static async uploadBannerImage(file: File, bannerId?: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${bannerId || Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `banners/${fileName}`

      const { data, error } = await supabaseAdmin.storage
        .from('banners')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('banners')
        .getPublicUrl(filePath)

      return { success: true, url: urlData.publicUrl }
    } catch (error) {
      console.error('Error uploading banner image:', error)
      return { success: false, error: 'Failed to upload banner image' }
    }
  }

  /**
   * Delete banner image from Supabase Storage
   */
  static async deleteBannerImage(imageUrl: string) {
    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/banners/')
      if (urlParts.length < 2) {
        throw new Error('Invalid image URL')
      }

      const filePath = `banners/${urlParts[1]}`

      const { error } = await supabaseAdmin.storage
        .from('banners')
        .remove([filePath])

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error deleting banner image:', error)
      return { success: false, error: 'Failed to delete banner image' }
    }
  }

  /**
   * Get active banners for store display by placement
   */
  static async getActiveBanners(placement?: string) {
    try {
      const now = new Date().toISOString()

      let query = supabaseAdmin
        .from('banners')
        .select('*')
        .eq('status', 'active')
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('position', { ascending: true })

      if (placement) {
        query = query.eq('placement', placement)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching active banners:', error)
      return { success: false, error: 'Failed to fetch active banners' }
    }
  }
}
