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

// Product variant for SKU-level data
export interface ProductVariant {
  id: string
  product_id: string
  name: string | null
  sku: string
  price: number
  discount_price?: number | null
  stock: number
  active: boolean
  position?: number | null
  image_url?: string | null
  created_at?: string | null
  updated_at?: string | null
  variant_images?: Array<{
    id: string
    image_url: string
    alt_text?: string | null
    position?: number | null
  }> | null
}

export interface ProductOptionValue {
  id: string
  name: string
  hex_color?: string
  position: number
}

export interface ProductOption {
  id: string
  product_id: string
  name: string
  position: number
  product_option_values: ProductOptionValue[]
}

export interface Product {
  id: string
  title: string
  subtitle?: string | null
  description: string | null
  price: number
  compare_price?: number | null
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
  // Default variant for product cards
  default_variant_id?: string | null
  default_variant?: ProductVariant | null
  // Product family for color variants
  product_family_id?: string | null
  // Related data from joins
  product_images?: ProductImage[] | null
  product_categories?: ProductCategory[] | null
  product_variants?: ProductVariant[] | null
  product_options?: ProductOption[] | null
  // Review aggregates
  average_rating?: number | null
  review_count?: number | null
  taxable?: boolean | null
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

