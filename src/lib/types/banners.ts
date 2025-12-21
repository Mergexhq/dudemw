// Banner Types for Backend Service

export type BannerPlacement = 'homepage-carousel' | 'product-listing-carousel' | 'category-banner' | 'top-marquee-banner'
export type BannerStatus = 'active' | 'scheduled' | 'expired' | 'disabled'
export type ActionType = 'collection' | 'category' | 'product' | 'external'

export interface Banner {
  id: string
  internal_title: string
  image_url: string | null
  placement: BannerPlacement
  status: BannerStatus

  // Action/Target
  action_type: ActionType | null
  action_target: string | null // ID or URL
  action_name: string | null // Display name

  // Scheduling
  start_date?: string
  end_date?: string

  // Placement-specific fields
  position?: number
  category?: string
  cta_text?: string

  // Data for complex banner types
  carousel_data?: any
  marquee_data?: any

  // Analytics
  impressions?: number
  clicks?: number

  // Metadata
  created_at: string
  updated_at: string
}

export interface BannerCreate {
  internal_title: string
  image_url?: string
  placement: BannerPlacement
  action_type?: ActionType
  action_target?: string
  action_name?: string
  start_date?: string
  end_date?: string
  position?: number
  category?: string
  cta_text?: string
  status?: BannerStatus
  carousel_data?: string // JSON string for carousel banners
  marquee_data?: string // JSON string for marquee banners
}

export interface BannerUpdate {
  internal_title?: string
  image_url?: string
  placement?: BannerPlacement
  action_type?: ActionType
  action_target?: string
  action_name?: string
  start_date?: string
  end_date?: string
  position?: number
  category?: string
  cta_text?: string
  status?: BannerStatus
  carousel_data?: string
  marquee_data?: string
}

export interface BannerFilters {
  search?: string
  placement?: string
  status?: string
  category?: string
}

export interface BannerStats {
  total: number
  active: number
  scheduled: number
  expired: number
  disabled: number
  totalClicks: number
  totalImpressions: number
  averageCTR: number
}

// Analytics interfaces removed - no longer tracking banner analytics
