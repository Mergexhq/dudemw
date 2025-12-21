'use server'

/**
 * Server Actions for Category Management
 * These run on the server and have access to service role keys
 */

import { CategoryService } from '@/lib/services/categories'

export interface CreateCategoryActionData {
  name: string
  slug: string
  description: string
  parent_id?: string | null
  image_url?: string | null
  icon_url?: string | null
  homepage_thumbnail_url?: string | null
  homepage_video_url?: string | null
  plp_square_thumbnail_url?: string | null
  selected_banner_id?: string | null
  meta_title?: string | null
  meta_description?: string | null
  status?: 'active' | 'inactive'
  display_order?: number
  product_ids?: string[]
}

/**
 * Server action to create a category
 * This bypasses RLS policies using service role
 */
export async function createCategoryAction(data: CreateCategoryActionData) {
  'use server'

  try {
    const result = await CategoryService.createCategory(data)
    return result
  } catch (error: any) {
    console.error('Server action error creating category:', error)
    return {
      success: false,
      error: error?.message || 'Failed to create category'
    }
  }
}

/**
 * Server action to upload category image
 * This bypasses RLS policies using service role
 */
export async function uploadCategoryImageAction(
  file: File,
  type: 'image' | 'icon' = 'image'
) {
  'use server'

  try {
    const result = await CategoryService.uploadImage(file, type)
    return result
  } catch (error: any) {
    console.error('Server action error uploading image:', error)
    return {
      success: false,
      error: error?.message || 'Failed to upload image'
    }
  }
}

/**
 * Server action to delete a category
 */
export async function deleteCategoryAction(id: string) {
  'use server'

  try {
    const result = await CategoryService.deleteCategory(id)
    return result
  } catch (error: any) {
    console.error('Server action error deleting category:', error)
    return {
      success: false,
      error: error?.message || 'Failed to delete category'
    }
  }
}

/**
 * Server action to update a category
 */
export async function updateCategoryAction(
  id: string,
  data: Partial<CreateCategoryActionData>
) {
  'use server'

  try {
    const result = await CategoryService.updateCategory(id, data)
    return result
  } catch (error: any) {
    console.error('Server action error updating category:', error)
    return {
      success: false,
      error: error?.message || 'Failed to update category'
    }
  }
}

/**
 * Server action to get a single category by ID
 */
export async function getCategoryAction(id: string) {
  'use server'

  try {
    const result = await CategoryService.getCategory(id)
    return result
  } catch (error: any) {
    console.error('Server action error getting category:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get category'
    }
  }
}

/**
 * Server action to get all categories
 */
export async function getCategoriesAction() {
  'use server'

  try {
    const result = await CategoryService.getCategoryTree()
    return result
  } catch (error: any) {
    console.error('Server action error getting categories:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get categories'
    }
  }
}

/**
 * Server action to get category tree
 */
export async function getCategoryTreeAction() {
  'use server'

  try {
    const result = await CategoryService.getCategoryTree()
    return result
  } catch (error: any) {
    console.error('Server action error getting category tree:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get category tree'
    }
  }
}

/**
 * Server action to get category statistics
 */
export async function getCategoryStatsAction() {
  'use server'

  try {
    const result = await CategoryService.getCategoryStats()
    return result
  } catch (error: any) {
    console.error('Server action error getting category stats:', error)
    return {
      success: false,
      error: error?.message || 'Failed to get category stats'
    }
  }
}


