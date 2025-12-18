import { supabaseAdmin } from '@/lib/supabase/supabase'
import { supabase } from '@/lib/supabase/client'

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string | null
  image_url?: string | null
  icon_url?: string | null
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
  meta_title?: string | null
  meta_description?: string | null
  status?: 'active' | 'inactive'
  display_order?: number
}

export interface UpdateCategoryData {
  name?: string
  slug?: string
  description?: string
  parent_id?: string | null
  image_url?: string | null
  icon_url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  status?: 'active' | 'inactive'
  display_order?: number
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
          product_count: cat.product_categories?.[0]?.count || 0
        })
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
      const { data: existing } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('slug', data.slug)
        .single()

      if (existing) {
        return { success: false, error: 'Category with this slug already exists' }
      }

      const { data: category, error } = await supabaseAdmin
        .from('categories')
        .insert([{
          ...data,
          status: data.status || 'active'
        }])
        .select()
        .single()

      if (error) throw error

      return { success: true, data: category }
    } catch (error) {
      console.error('Error creating category:', error)
      return { success: false, error: 'Failed to create category' }
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

      const { data: category, error } = await supabaseAdmin
        .from('categories')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

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
  static async uploadImage(file: File, type: 'image' | 'icon' = 'image') {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${type}-${Date.now()}.${fileExt}`
      const filePath = `categories/${fileName}`

      const { data, error } = await supabase.storage
        .from('public-assets')
        .upload(filePath, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('public-assets')
        .getPublicUrl(filePath)

      return { success: true, url: publicUrl }
    } catch (error) {
      console.error('Error uploading image:', error)
      return { success: false, error: 'Failed to upload image' }
    }
  }

  /**
   * Delete image from storage
   */
  static async deleteImage(imageUrl: string) {
    try {
      const path = imageUrl.split('/public-assets/')[1]
      if (!path) return { success: true }

      const { error } = await supabase.storage
        .from('public-assets')
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
          .update({ display_order: update.display_order })
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
      // First, get all categories
      const { data: categories, error: categoriesError } = await supabaseAdmin
        .from('categories')
        .select('id, status')

      if (categoriesError) {
        const errorMsg = categoriesError?.message || categoriesError?.error_description || JSON.stringify(categoriesError)
        console.error('Error fetching categories for stats:', errorMsg, categoriesError)
        throw new Error(`Failed to fetch categories: ${errorMsg}`)
      }

      // Then, get product counts per category
      const { data: productCounts, error: countsError } = await supabaseAdmin
        .from('product_categories')
        .select('category_id')

      if (countsError) {
        console.error('Error fetching product counts:', countsError)
        // Continue without product counts rather than failing completely
      }

      // Calculate stats
      const total = categories?.length || 0
      const active = categories?.filter(c => c.status === 'active').length || 0
      const inactive = total - active

      // Count products per category
      const categoryProductCount = new Map<string, number>()
      productCounts?.forEach(pc => {
        const count = categoryProductCount.get(pc.category_id) || 0
        categoryProductCount.set(pc.category_id, count + 1)
      })

      const with_products = Array.from(categoryProductCount.keys()).length
      const total_products = Array.from(categoryProductCount.values()).reduce((sum, count) => sum + count, 0)

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
