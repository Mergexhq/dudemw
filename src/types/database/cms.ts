import { Json } from './common'

// About Features Table
export type AboutFeaturesTable = {
  Row: {
    id: string
    title: string
    description: string
    icon_name: string
    sort_order: number
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    title: string
    description: string
    icon_name: string
    sort_order?: number
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    title?: string
    description?: string
    icon_name?: string
    sort_order?: number
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

// About Stats Table
export type AboutStatsTable = {
  Row: {
    id: string
    value: string
    label: string
    sort_order: number
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    value: string
    label: string
    sort_order?: number
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    value?: string
    label?: string
    sort_order?: number
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

// Why Dude Sections Table
export type WhyDudeSectionsTable = {
  Row: {
    id: string
    title: string
    description: string
    icon_name: string
    sort_order: number
    is_active: boolean
    created_at: string
    updated_at: string
  }
  Insert: {
    id?: string
    title: string
    description: string
    icon_name: string
    sort_order?: number
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Update: {
    id?: string
    title?: string
    description?: string
    icon_name?: string
    sort_order?: number
    is_active?: boolean
    created_at?: string
    updated_at?: string
  }
  Relationships: []
}

// Type definitions for components
export type AboutFeature = {
  id: string
  title: string
  description: string
  icon_name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AboutStat = {
  id: string
  value: string
  label: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type WhyDudeFeature = {
  id: string
  title: string
  description: string
  icon_name: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}