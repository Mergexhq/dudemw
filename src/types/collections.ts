import { Database } from './database'

// Base types from database
export type Collection = Database['public']['Tables']['collections']['Row']
export type CollectionInsert = Database['public']['Tables']['collections']['Insert']
export type CollectionUpdate = Database['public']['Tables']['collections']['Update']

export type ProductCollection = Database['public']['Tables']['product_collections']['Row']
export type ProductCollectionInsert = Database['public']['Tables']['product_collections']['Insert']

export type HomepageSection = Database['public']['Tables']['homepage_sections']['Row']
export type HomepageSectionInsert = Database['public']['Tables']['homepage_sections']['Insert']
export type HomepageSectionUpdate = Database['public']['Tables']['homepage_sections']['Update']

// Extended types with relations
export interface HomepageSectionWithCollection extends HomepageSection {
  collection?: Collection | null
}

export interface CollectionWithProducts extends Collection {
  products?: ProductCollection[]
}

// Collection rule types for rule-based collections
export interface CollectionRule {
  // Product filters
  category_id?: string[]
  tag_ids?: string[]
  price?: {
    gte?: number
    lte?: number
  }
  created_at?: {
    gte?: string | 'last_30_days' | 'last_7_days'
    lte?: string
  }
  sales_count?: {
    gte?: number
  }
  inventory_quantity?: {
    gte?: number
    lte?: number
  }
  // Sorting
  sort_by?: 'created_at' | 'price' | 'sales_count' | 'name'
  sort_order?: 'asc' | 'desc'
  // Limit
  limit?: number
}

// Collection types
export type CollectionType = 'manual' | 'rule'

// Layout types for homepage sections
export type HomepageSectionLayout = 'grid' | 'carousel' | 'banner'
