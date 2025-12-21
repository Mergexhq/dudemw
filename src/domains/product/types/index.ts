// Product and Category types - use these with direct Supabase calls

// Product image from product_images table
export interface ProductImage {
  id: string
  product_id: string
  image_url: string
  alt_text?: string | null
  is_primary?: boolean
  display_order?: number
}

// Product category relation
export interface ProductCategory {
  id: string
  product_id: string
  category_id: string
  categories?: Category
}

export interface Product {
  id: string
  title: string
  description: string | null
  price: number
  original_price?: number | null
  images: string[] | null
  category_id: string | null
  sizes: string[] | null
  colors: string[] | null
  in_stock: boolean | null
  is_bestseller: boolean | null
  is_new_drop: boolean | null
  is_featured?: boolean | null
  is_on_sale?: boolean | null
  discount_percentage?: number | null
  badge_text?: string | null
  badge_color?: string | null
  slug: string
  created_at: string | null
  updated_at: string | null
  // Additional product attributes
  highlights?: string[] | null
  material?: string | null
  fabric_weight?: string | null
  care_instructions?: string | null
  // Related data from joins
  product_images?: ProductImage[] | null
  product_categories?: ProductCategory[] | null
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  image_url?: string | null
  icon_url?: string | null
  homepage_thumbnail_url?: string | null
  homepage_video_url?: string | null
  plp_square_thumbnail_url?: string | null
  parent_id?: string | null
  status?: string | null
  display_order?: number | null
  meta_title?: string | null
  meta_description?: string | null
  selected_banner_id?: string | null
  created_at: string | null
  updated_at: string | null
}

