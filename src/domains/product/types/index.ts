// Product and Category types - use these with direct Supabase calls
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
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  image?: string | null
  parent_id?: string | null
  created_at: string | null
  updated_at: string | null
}
