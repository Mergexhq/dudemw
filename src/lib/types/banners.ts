// Banner Types for Backend Service

export type BannerPlacement = 'homepage-carousel' | 'product-listing-carousel' | 'category-banner'
export type BannerStatus = 'active' | 'scheduled' | 'expired' | 'disabled'
export type ActionType = 'collection' | 'category' | 'product' | 'external'

export interface Banner {
  id: string
  internal_title: string
  image_url: string
  placement: BannerPlacement
  status: BannerStatus
  
  // Action/Target
  action_type: ActionType
  action_target: string // ID or URL
  action_name: string // Display name
  
  // Scheduling
  start_date?: string
  end_date?: string
  
  // Placement-specific fields
  position?: number
  category?: string
  cta_text?: string
  
  // Analytics
  clicks: number
  impressions: number
  ctr: number
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface BannerCreate {
  internal_title: string
  image_url: string
  placement: BannerPlacement
  action_type: ActionType
  action_target: string
  action_name: string
  start_date?: string
  end_date?: string
  position?: number
  category?: string
  cta_text?: string
  status?: BannerStatus
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

export interface BannerAnalytics {
  banner_id: string
  clicks: number
  impressions: number
  ctr: number
  date: string
}

export interface BannerClickEvent {
  banner_id: string
  user_id?: string
  session_id?: string
  timestamp: string
}

export interface BannerImpressionEvent {
  banner_id: string
  user_id?: string
  session_id?: string
  timestamp: string
}
