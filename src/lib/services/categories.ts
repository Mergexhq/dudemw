import { prisma } from '@/lib/db'
import { StorageDeletionService } from '@/lib/services/storage-deletion'

export interface Category {
  id: string
  name: string
  slug: string
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
  image_url?: string | null
  icon_url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  status?: 'active' | 'inactive'
  display_order?: number
  product_ids?: string[]
}

export interface UpdateCategoryData {
  name?: string
  slug?: string
  image_url?: string | null
  icon_url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  status?: 'active' | 'inactive'
  display_order?: number
  product_ids?: string[]
}

export class CategoryService {
  /** Get all categories */
  static async getCategories() {
    try {
      const categories = await prisma.categories.findMany({
        include: {
          _count: { select: { product_categories: true } },
        },
        orderBy: [{ display_order: 'asc' }, { name: 'asc' }],
      })
      return { success: true, data: categories }
    } catch (error) {
      console.error('Error fetching categories:', error)
      return { success: false, error: 'Failed to fetch categories' }
    }
  }

  /** Get categories as tree structure */
  static async getCategoryTree(): Promise<{ success: boolean; data?: CategoryWithChildren[]; error?: string }> {
    try {
      const categories = await prisma.categories.findMany({
        include: { _count: { select: { product_categories: true } } },
        orderBy: { display_order: 'asc' },
      })

      const tree: CategoryWithChildren[] = categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image_url: cat.image_url,
        icon_url: cat.icon_url,
        meta_title: cat.meta_title,
        meta_description: cat.meta_description,
        status: ((cat as any).status || 'active') as 'active' | 'inactive',
        display_order: cat.display_order ?? undefined,
        created_at: cat.created_at?.toISOString() ?? '',
        updated_at: cat.updated_at?.toISOString() ?? '',
        children: [],
        product_count: cat._count.product_categories,
      }))

      return { success: true, data: tree }
    } catch (error) {
      console.error('Error fetching category tree:', error)
      return { success: false, error: 'Failed to fetch category tree' }
    }
  }

  /** Get single category by ID */
  static async getCategory(id: string) {
    try {
      const data = await prisma.categories.findUnique({
        where: { id },
        include: { _count: { select: { product_categories: true } } },
      })
      if (!data) return { success: false, error: 'Category not found' }
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching category:', error)
      return { success: false, error: 'Failed to fetch category' }
    }
  }

  /** Get category by slug */
  static async getCategoryBySlug(slug: string) {
    try {
      const data = await prisma.categories.findUnique({ where: { slug } })
      if (!data) return { success: false, error: 'Category not found' }
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching category by slug:', error)
      return { success: false, error: 'Category not found' }
    }
  }

  /** Create new category */
  static async createCategory(data: CreateCategoryData) {
    try {
      const { product_ids, ...categoryData } = data

      // Check duplicate slug
      const existing = await prisma.categories.findUnique({ where: { slug: categoryData.slug }, select: { id: true } })
      if (existing) return { success: false, error: 'Category with this slug already exists' }

      const category = await prisma.categories.create({
        data: {
          name: categoryData.name,
          slug: categoryData.slug,
          image_url: categoryData.image_url,
          icon_url: categoryData.icon_url,
          meta_title: categoryData.meta_title,
          meta_description: categoryData.meta_description,
          display_order: categoryData.display_order,
          status: categoryData.status || 'active',
        } as any,
      })

      // Associate products
      if (product_ids && product_ids.length > 0) {
        await prisma.product_categories.createMany({
          data: product_ids.map(product_id => ({ product_id, category_id: category.id })),
          skipDuplicates: true,
        })
      }

      return { success: true, data: category }
    } catch (error: any) {
      console.error('Error creating category:', error)
      return { success: false, error: `Failed to create category: ${error?.message || 'Unknown error'}` }
    }
  }

  /** Update category */
  static async updateCategory(id: string, data: UpdateCategoryData) {
    try {
      const { product_ids, ...categoryUpdateData } = data

      // Check duplicate slug if being changed
      if (categoryUpdateData.slug) {
        const existing = await prisma.categories.findFirst({
          where: { slug: categoryUpdateData.slug, NOT: { id } },
          select: { id: true },
        })
        if (existing) return { success: false, error: 'Category with this slug already exists' }
      }

      const category = await prisma.categories.update({
        where: { id },
        data: { ...categoryUpdateData, updated_at: new Date() } as any,
      })

      // Update product associations if provided
      if (product_ids !== undefined) {
        await prisma.product_categories.deleteMany({ where: { category_id: id } })
        if (product_ids.length > 0) {
          await prisma.product_categories.createMany({
            data: product_ids.map(product_id => ({ product_id, category_id: id })),
            skipDuplicates: true,
          })
        }
      }

      return { success: true, data: category }
    } catch (error) {
      console.error('Error updating category:', error)
      return { success: false, error: 'Failed to update category' }
    }
  }

  /** Delete category */
  static async deleteCategory(id: string) {
    try {
      // Check if category has products
      const productCount = await prisma.product_categories.count({ where: { category_id: id } })
      if (productCount > 0) return { success: false, error: 'Cannot delete category with products' }

      // Cleanup images
      const category = await prisma.categories.findUnique({
        where: { id },
        select: { image_url: true, icon_url: true },
      })
      if (category) {
        StorageDeletionService.deleteCategoryImages(category as any).catch(err =>
          console.error('Failed to cleanup category images:', err)
        )
      }

      await prisma.categories.delete({ where: { id } })
      return { success: true }
    } catch (error) {
      console.error('Error deleting category:', error)
      return { success: false, error: 'Failed to delete category' }
    }
  }

  /** Reorder categories */
  static async reorderCategories(categoryIds: string[]) {
    try {
      await prisma.$transaction(
        categoryIds.map((id, index) =>
          prisma.categories.update({
            where: { id },
            data: { display_order: index + 1 } as any,
          })
        )
      )
      return { success: true }
    } catch (error) {
      console.error('Error reordering categories:', error)
      return { success: false, error: 'Failed to reorder categories' }
    }
  }

  /** Get category statistics */
  static async getCategoryStats(): Promise<{ success: boolean; data?: CategoryStats; error?: string }> {
    try {
      const categories = await prisma.categories.findMany({
        include: { _count: { select: { product_categories: true } } },
      })

      const total = categories.length
      const active = categories.filter(c => (c as any).status === 'active').length
      let with_products = 0
      let total_products = 0

      categories.forEach(cat => {
        if (cat._count.product_categories > 0) {
          total_products += cat._count.product_categories
          with_products++
        }
      })

      return { success: true, data: { total, active, inactive: total - active, with_products, total_products } }
    } catch (error: any) {
      console.error('Error fetching category stats:', error?.message)
      return { success: false, error: `Failed to fetch category statistics: ${error?.message}` }
    }
  }

  static generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }

  // Upload via Cloudinary — no change needed (API route based)
  static async uploadImage(file: File, type: 'image' | 'icon' = 'image') {
    try {
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        return { success: false, error: `File size exceeds 5MB limit.` }
      }
      const formData = new FormData()
      formData.append('file', file)
      const { uploadImageAction } = await import('@/app/actions/media')
      const result = await uploadImageAction(formData, 'categories')
      if (!result.success) return { success: false, error: result.error || 'Failed to upload image' }
      return { success: true, url: result.url }
    } catch (error) {
      return { success: false, error: 'Failed to upload image' }
    }
  }
}
