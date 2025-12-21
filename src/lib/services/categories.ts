import { supabaseAdmin } from '@/lib/supabase/supabase'
import { createClient } from '@/lib/supabase/client'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string | null
  image_url?: string | null
  icon_url?: string | null
  // New media fields
  homepage_thumbnail_url?: string | null
  homepage_video_url?: string | null
  plp_square_thumbnail_url?: string | null
  // Banner management
  selected_banner_id?: string | null
  // SEO fields
  meta_title?: string | null
  meta_description?: string | null
  status: 'active' | 'inactive'
  display_order?: number
  created_at: string
  updated_at: string
}

export interface CategoryWithChildren extends Category {
  children: CategoryWithChildren[]
  product_count?: number
}

export interface CategoryStats {
  total: number
  active: number
  inactive: number
  with_products: number
  total_products: number
}

export interface CreateCategoryData {
  name: string
  slug: string
  description?: string
  parent_id?: string | null
  image_url?: string | null
  icon_url?: string | null
  // New media fields
  homepage_thumbnail_url?: string | null
  homepage_video_url?: string | null
  plp_square_thumbnail_url?: string | null
  // Banner management
  selected_banner_id?: string | null
  // SEO fields
  meta_title?: string | null
  meta_description?: string | null
  status?: 'active' | 'inactive'
  display_order?: number
  product_ids?: string[]
}

export interface UpdateCategoryData {
  name?: string
  slug?: string
  description?: string
  parent_id?: string | null
  image_url?: string | null
  icon_url?: string | null
  // New media fields
  homepage_thumbnail_url?: string | null
  homepage_video_url?: string | null
  plp_square_thumbnail_url?: string | null
  // Banner management
  selected_banner_id?: string | null
  // SEO fields
  meta_title?: string | null
  meta_description?: string | null
  status?: 'active' | 'inactive'
  display_order?: number
  product_ids?: string[]
}

export class CategoryService {
  /**
   * Get all categories with optional filters
   */
  static async getCategories() {
    try {
      const { data: categories, error } = await supabaseAdmin
        .from('categories')
        .select(`
          *,
          product_categories(count)
        `)
        .order('display_order', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error

      return { success: true, data: categories }
    } catch (error) {
      console.error('Error fetching categories:', error)
      return { success: false, error: 'Failed to fetch categories' }
    }
  }

  /**
   * Get categories as tree structure
   */
  static async getCategoryTree(): Promise<{ success: boolean; data?: CategoryWithChildren[]; error?: string }> {
    try {
      const { data: categories, error } = await supabaseAdmin
        .from('categories')
        .select(`
          *,
          product_categories(count)
        `)
        .order('display_order', { ascending: true })

      if (error) throw error

      // Build tree structure
      const categoryMap = new Map<string, CategoryWithChildren>()
      const rootCategories: CategoryWithChildren[] = []

      // First pass: create all category objects
      categories?.forEach(cat => {
        categoryMap.set(cat.id, {
          ...cat,
          children: [],
          status: (cat as any).status || 'active',
          product_count: cat.product_categories?.[0]?.count || 0
        } as CategoryWithChildren)
      })

      // Second pass: build tree
      categories?.forEach(cat => {
        const category = categoryMap.get(cat.id)!
        if (cat.parent_id && categoryMap.has(cat.parent_id)) {
          categoryMap.get(cat.parent_id)!.children.push(category)
        } else {
          rootCategories.push(category)
        }
      })

      return { success: true, data: rootCategories }
    } catch (error) {
      console.error('Error fetching category tree:', error)
      return { success: false, error: 'Failed to fetch category tree' }
    }
  }

  /**
   * Get single category by ID
   */
  static async getCategory(id: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select(`
          *,
          product_categories(count)
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching category:', error)
      return { success: false, error: 'Failed to fetch category' }
    }
  }

  /**
   * Get category by slug
   */
  static async getCategoryBySlug(slug: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching category by slug:', error)
      return { success: false, error: 'Category not found' }
    }
  }

  /**
   * Create new category
   */
  static async createCategory(data: CreateCategoryData) {
    try {
      // Check for duplicate slug
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', data.slug)
        .maybeSingle() // Use maybeSingle instead of single to avoid error when not found

      if (checkError) {
        console.error('Error checking duplicate slug:', {
          message: checkError.message,
          details: checkError.details,
          hint: checkError.hint,
          code: checkError.code
        })
        // Don't fail on check error, continue with insert
      }

      if (existing) {
        return { success: false, error: 'Category with this slug already exists' }
      }

      // Extract product_ids to avoid sending them to categories table
      const { product_ids, ...categoryData } = data

      const { data: category, error } = await supabaseAdmin
        .from('categories')
        .insert([{
          ...categoryData,
          status: categoryData.status || 'active'
        }])
        .select()
        .single()

      if (error) {
        console.error('Error inserting category:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          data: data,
          fullError: JSON.stringify(error, null, 2)
        })
        // Return more specific error message
        return {
          success: false,
          error: `Database error: ${error.message || 'Unknown error'} ${error.hint ? `(Hint: ${error.hint})` : ''}`
        }
      }

      // If products are selected, add them to the category
      if (data.product_ids && data.product_ids.length > 0) {
        const productAssociations = data.product_ids.map(productId => ({
          product_id: productId,
          category_id: category.id
        }))

        const { error: productsError } = await supabaseAdmin
          .from('product_categories')
          .insert(productAssociations)

        if (productsError) {
          console.error('Error adding products to category:', productsError)
          // We don't fail the whole operation if adding products fails, but we log it
          // Could optionally return a warning
        }
      }

      return { success: true, data: category }
    } catch (error: any) {
      console.error('Error creating category:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        full_error: JSON.stringify(error, null, 2)
      })
      return {
        success: false,
        error: `Failed to create category: ${error?.message || 'Unknown error'} ${error?.hint ? `(${error.hint})` : ''}`
      }
    }
  }

  /**
   * Update category
   */
  static async updateCategory(id: string, data: UpdateCategoryData) {
    try {
      // If slug is being updated, check for duplicates
      if (data.slug) {
        const { data: existing } = await supabaseAdmin
          .from('categories')
          .select('id')
          .eq('slug', data.slug)
          .neq('id', id)
          .single()

        if (existing) {
          return { success: false, error: 'Category with this slug already exists' }
        }
      }


      // Extract product_ids to avoid sending them to categories table
      const { product_ids, ...categoryUpdateData } = data

      const { data: category, error } = await supabaseAdmin
        .from('categories')
        .update({
          ...categoryUpdateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Update product associations if provided
      if (product_ids) {
        // First delete existing associations
        // Note: This is a simple approach. For better performance/history we might want to diff.
        // Or if we want to KEEP existing ones and only ADD/REMOVE, we would need different logic.
        // But "product_ids" usually implies "set the list to this".

        await supabaseAdmin
          .from('product_categories')
          .delete()
          .eq('category_id', id)

        // Then insert new ones
        if (product_ids.length > 0) {
          const productAssociations = product_ids.map(productId => ({
            product_id: productId,
            category_id: id
          }))

          const { error: productsError } = await supabaseAdmin
            .from('product_categories')
            .insert(productAssociations)

          if (productsError) {
            console.error('Error updating product associations:', productsError)
          }
        }
      }

      return { success: true, data: category }
    } catch (error) {
      console.error('Error updating category:', error)
      return { success: false, error: 'Failed to update category' }
    }
  }

  /**
   * Delete category
   */
  static async deleteCategory(id: string) {
    try {
      // Check if category has children
      const { data: children } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('parent_id', id)
        .limit(1)

      if (children && children.length > 0) {
        return { success: false, error: 'Cannot delete category with subcategories' }
      }

      // Check if category has products
      const { data: products } = await supabaseAdmin
        .from('product_categories')
        .select('id')
        .eq('category_id', id)
        .limit(1)

      if (products && products.length > 0) {
        return { success: false, error: 'Cannot delete category with products' }
      }

      const { error } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error deleting category:', error)
      return { success: false, error: 'Failed to delete category' }
    }
  }

  /**
   * Upload category image to Supabase Storage
   */
  /**
   * Upload category image to Supabase Storage
   */
  static async uploadImage(file: File, type: 'image' | 'icon' | 'homepage_thumbnail' | 'plp_square' = 'image') {
    try {
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB in bytes
      if (file.size > maxSize) {
        return {
          success: false,
          error: `File size exceeds 5MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`
        }
      }

      // Note: Dimension validation removed - images are now auto-cropped to correct ratio in media-step.tsx before upload

      // Create fresh authenticated client to get current user session
      const supabase = createClient()

      const fileExt = file.name.split('.').pop()
      const fileName = `${type}-${Date.now()}.${fileExt}`
      const filePath = `${fileName}`

      const { data, error } = await supabase.storage
        .from('categories')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('categories')
        .getPublicUrl(filePath)

      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Error uploading image:', error)
      return { success: false, error: 'Failed to upload image' }
    }
  }

  /**
   * Validate image dimensions for specific types
   */
  private static validateImageDimensions(
    file: File,
    type: 'image' | 'homepage_thumbnail' | 'plp_square'
  ): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const img = new Image()
      const url = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(url)

        const width = img.width
        const height = img.height
        const aspectRatio = width / height

        if (type === 'homepage_thumbnail') {
          // Expected portrait ratio: 3:4 (0.75), allowing some tolerance (0.7 - 0.8)
          if (aspectRatio >= 0.7 && aspectRatio <= 0.8) {
            resolve({ valid: true })
          } else {
            resolve({
              valid: false,
              error: `Homepage thumbnail must be portrait orientation (3:4 ratio). Current: ${width}x${height}`
            })
          }
        } else {
          // Default for 'image' or 'plp_square': Square ratio (1:1), allowing tolerance (0.9 - 1.1)
          if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
            resolve({ valid: true })
          } else {
            resolve({
              valid: false,
              error: `${type === 'plp_square' ? 'PLP thumbnail' : 'Category image'} must be square (1:1 ratio). Current: ${width}x${height}`
            })
          }
        }
      }

      img.onerror = () => {
        URL.revokeObjectURL(url)
        resolve({ valid: false, error: 'Failed to load image for validation' })
      }

      img.src = url
    })
  }

  /**
   * Delete image from storage
   */
  static async deleteImage(imageUrl: string) {
    try {
      // Create fresh authenticated client to get current user session
      const supabase = createClient()

      const path = imageUrl.split('/categories/')[1]
      if (!path) return { success: true }

      const { error } = await supabase.storage
        .from('categories')
        .remove([path])

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error deleting image:', error)
      return { success: false, error: 'Failed to delete image' }
    }
  }

  /**
   * Reorder categories
   */
  static async reorderCategories(categoryIds: string[]) {
    try {
      const updates = categoryIds.map((id, index) => ({
        id,
        display_order: index + 1
      }))

      for (const update of updates) {
        await supabaseAdmin
          .from('categories')
          .update({ display_order: update.display_order } as any)
          .eq('id', update.id)
      }

      return { success: true }
    } catch (error) {
      console.error('Error reordering categories:', error)
      return { success: false, error: 'Failed to reorder categories' }
    }
  }

  /**
   * Get category statistics
   */
  static async getCategoryStats(): Promise<{ success: boolean; data?: CategoryStats; error?: string }> {
    try {
      // Get categories with status and product counts in one query
      const { data: categories, error } = await supabaseAdmin
        .from('categories')
        .select(`
          id,
          status,
          product_categories(count)
        `)

      if (error) {
        const errorMsg = error?.message || JSON.stringify(error)
        console.error('Error fetching category stats:', errorMsg, error)
        throw new Error(`Failed to fetch category stats: ${errorMsg}`)
      }

      // Calculate stats
      const total = categories?.length || 0
      const active = categories?.filter(c => (c as any).status === 'active').length || 0
      const inactive = total - active

      // Calculate product stats
      let total_products = 0
      let with_products = 0

      categories?.forEach((cat: any) => {
        const count = cat.product_categories?.[0]?.count || 0
        if (count > 0) {
          total_products += count
          with_products++
        }
      })

      return {
        success: true,
        data: {
          total,
          active,
          inactive,
          with_products,
          total_products
        }
      }
    } catch (error: any) {
      const errorMessage = error?.message || error?.error_description || JSON.stringify(error) || 'Unknown error'
      console.error('Error fetching category stats:', errorMessage, error)
      return {
        success: false,
        error: `Failed to fetch category statistics: ${errorMessage}`
      }
    }
  }

  /**
   * Generate SEO-friendly slug from name
   */
  static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}
