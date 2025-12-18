import { supabaseAdmin } from '@/lib/supabase/supabase'
import { supabase } from '@/lib/supabase/client'

export interface ProductAnalytics {
  product_id: string
  view_count: number
  add_to_cart_count: number
  purchase_count: number
  total_revenue: number
  conversion_rate: number
  last_viewed_at?: string
}

export interface ProductSEO {
  meta_title?: string
  meta_description?: string
  keywords?: string[]
  og_image?: string
  seo_score?: number
}

export interface BulkImportProduct {
  title: string
  slug: string
  description?: string
  price: number
  compare_price?: number
  sku: string
  stock: number
  category?: string
  status?: string
}

export class ProductService {
  /**
   * Get all products with optional filters
   */
  static async getProducts(filters?: {
    search?: string
    categoryId?: string
    collectionId?: string
    status?: string
    stockStatus?: string
    featured?: boolean
    limit?: number
    offset?: number
    sortBy?: 'created_at' | 'title' | 'price' | 'updated_at'
    sortOrder?: 'asc' | 'desc'
  }) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            image_url,
            alt_text,
            is_primary,
            sort_order
          ),
          product_variants (
            id,
            name,
            sku,
            price,
            discount_price,
            stock,
            active
          ),
          product_categories (
            categories (
              id,
              name,
              slug
            )
          ),
          product_collections (
            collections (
              id,
              title,
              slug
            )
          )
        `)

      // Apply filters
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
      }

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.categoryId) {
        // Need to filter via join - will be applied client-side
      }

      if (filters?.collectionId) {
        // Need to filter via join - will be applied client-side
      }

      if (filters?.featured !== undefined) {
        query = query.eq('is_featured', filters.featured)
      }

      // Sorting
      const sortBy = filters?.sortBy || 'created_at'
      const sortOrder = filters?.sortOrder === 'asc' ? true : false
      query = query.order(sortBy, { ascending: sortOrder })

      // Pagination
      if (filters?.limit) {
        query = query.limit(filters.limit)
      }
      if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) throw error

      // Apply client-side filters that require joins
      let filteredData = data

      if (filters?.categoryId) {
        filteredData = filteredData?.filter(product => 
          product.product_categories?.some((pc: any) => pc.categories?.id === filters.categoryId)
        )
      }

      if (filters?.collectionId) {
        filteredData = filteredData?.filter(product => 
          product.product_collections?.some((pc: any) => pc.collections?.id === filters.collectionId)
        )
      }

      if (filters?.stockStatus && filters.stockStatus !== 'all') {
        filteredData = filteredData?.filter(product => {
          const totalStock = product.global_stock || 
            product.product_variants?.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0) || 0
          
          switch (filters.stockStatus) {
            case 'in-stock':
              return totalStock > 0
            case 'low-stock':
              return totalStock > 0 && totalStock < 10
            case 'out-of-stock':
              return totalStock === 0
            default:
              return true
          }
        })
      }

      return { success: true, data: filteredData || [] }
    } catch (error) {
      console.error('Error fetching products:', error)
      return { success: false, error: 'Failed to fetch products' }
    }
  }

  /**
   * Get a single product by ID or slug
   */
  static async getProduct(identifier: string, bySlug = false) {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            image_url,
            alt_text,
            is_primary,
            sort_order
          ),
          product_options (
            id,
            name,
            position,
            product_option_values (
              id,
              name,
              hex_color,
              position
            )
          ),
          product_variants (
            id,
            name,
            sku,
            price,
            discount_price,
            stock,
            active,
            position,
            variant_option_values (
              option_value_id,
              product_option_values (
                id,
                name,
                hex_color,
                product_options (
                  id,
                  name
                )
              )
            ),
            inventory_items (
              id,
              quantity,
              reserved_quantity,
              available_quantity,
              track_quantity,
              allow_backorders,
              low_stock_threshold
            )
          ),
          product_categories (
            categories (
              id,
              name,
              slug
            )
          ),
          product_collections (
            collections (
              id,
              title,
              slug
            )
          ),
          product_tag_assignments (
            product_tags (
              id,
              name,
              slug
            )
          )
        `)

      if (bySlug) {
        query = query.eq('slug', identifier)
      } else {
        query = query.eq('id', identifier)
      }

      const { data, error } = await query.single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Error fetching product:', error)
      return { success: false, error: 'Failed to fetch product' }
    }
  }

  /**
   * Get featured products
   */
  static async getFeaturedProducts(limit = 8) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            image_url,
            alt_text,
            is_primary
          )
        `)
        .eq('is_featured', true)
        .eq('status', 'active')
        .limit(limit)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching featured products:', error)
      return { success: false, error: 'Failed to fetch featured products' }
    }
  }

  /**
   * Get new arrivals (products from last 30 days)
   */
  static async getNewArrivals(limit = 8) {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            image_url,
            alt_text,
            is_primary
          )
        `)
        .eq('status', 'active')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .limit(limit)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching new arrivals:', error)
      return { success: false, error: 'Failed to fetch new arrivals' }
    }
  }

  /**
   * Get best sellers based on analytics
   */
  static async getBestSellers(limit = 8) {
    try {
      // First get top selling product IDs from analytics
      const { data: analytics, error: analyticsError } = await supabase
        .from('product_analytics')
        .select('product_id, purchase_count')
        .order('purchase_count', { ascending: false })
        .limit(limit)

      if (analyticsError) throw analyticsError

      if (!analytics || analytics.length === 0) {
        // If no analytics, return recent products
        return this.getNewArrivals(limit)
      }

      const productIds = analytics.map(a => a.product_id)

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (
            id,
            image_url,
            alt_text,
            is_primary
          )
        `)
        .in('id', productIds)
        .eq('status', 'active')

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching best sellers:', error)
      return { success: false, error: 'Failed to fetch best sellers' }
    }
  }

  /**
   * Duplicate a product with all its data
   */
  static async duplicateProduct(productId: string) {
    try {
      // Get original product
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          product_images(*),
          product_variants(*),
          product_categories(*)
        `)
        .eq('id', productId)
        .single()

      if (productError) throw productError

      // Create new product with modified data
      const newSlug = `${product.slug}-copy-${Date.now()}`
      const { data: newProduct, error: createError } = await supabaseAdmin
        .from('products')
        .insert([{
          title: `${product.title} (Copy)`,
          slug: newSlug,
          description: product.description,
          price: product.price,
          compare_price: product.compare_price,
          global_stock: product.global_stock,
          status: 'draft', // Set as draft by default
          meta_title: product.meta_title,
          meta_description: product.meta_description,
          is_featured: false
        }])
        .select()
        .single()

      if (createError) throw createError

      // Copy images
      if (product.product_images && product.product_images.length > 0) {
        const imageInserts = product.product_images.map((img: any) => ({
          product_id: newProduct.id,
          image_url: img.image_url,
          alt_text: img.alt_text,
          is_primary: img.is_primary,
          display_order: img.display_order
        }))

        await supabaseAdmin.from('product_images').insert(imageInserts)
      }

      // Copy variants with new SKUs
      if (product.product_variants && product.product_variants.length > 0) {
        const variantInserts = product.product_variants.map((variant: any, index: number) => ({
          product_id: newProduct.id,
          name: variant.name,
          sku: `${variant.sku}-copy-${Date.now()}-${index}`,
          price: variant.price,
          stock: variant.stock,
          size: variant.size,
          color: variant.color,
          material: variant.material,
          active: variant.active
        }))

        await supabaseAdmin.from('product_variants').insert(variantInserts)
      }

      // Copy categories
      if (product.product_categories && product.product_categories.length > 0) {
        const categoryInserts = product.product_categories.map((pc: any) => ({
          product_id: newProduct.id,
          category_id: pc.category_id
        }))

        await supabaseAdmin.from('product_categories').insert(categoryInserts)
      }

      return { success: true, data: newProduct }
    } catch (error) {
      console.error('Error duplicating product:', error)
      return { success: false, error: 'Failed to duplicate product' }
    }
  }

  /**
   * Bulk import products from CSV data
   */
  static async bulkImport(products: BulkImportProduct[]) {
    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      }

      for (const product of products) {
        try {
          // Check if slug exists
          const { data: existing } = await supabaseAdmin
            .from('products')
            .select('id')
            .eq('slug', product.slug)
            .single()

          if (existing) {
            results.failed++
            results.errors.push(`Product with slug "${product.slug}" already exists`)
            continue
          }

          // Create product
          const { data: newProduct, error: productError } = await supabaseAdmin
            .from('products')
            .insert([{
              title: product.title,
              slug: product.slug,
              description: product.description,
              price: product.price,
              compare_price: product.compare_price,
              global_stock: product.stock,
              status: product.status || 'active'
            }])
            .select()
            .single()

          if (productError) throw productError

          // Create default variant
          await supabaseAdmin
            .from('product_variants')
            .insert([{
              product_id: newProduct.id,
              name: 'Default',
              sku: product.sku,
              price: product.price,
              stock: product.stock,
              active: true
            }])

          // Link to category if provided
          if (product.category) {
            const { data: category } = await supabaseAdmin
              .from('categories')
              .select('id')
              .eq('slug', product.category)
              .single()

            if (category) {
              await supabaseAdmin
                .from('product_categories')
                .insert([{
                  product_id: newProduct.id,
                  category_id: category.id
                }])
            }
          }

          results.success++
        } catch (error: any) {
          results.failed++
          results.errors.push(`Failed to import "${product.title}": ${error.message}`)
        }
      }

      return { success: true, data: results }
    } catch (error) {
      console.error('Error in bulk import:', error)
      return { success: false, error: 'Bulk import failed' }
    }
  }

  /**
   * Export products to CSV format
   */
  static async exportProducts() {
    try {
      const { data: products, error } = await supabaseAdmin
        .from('products')
        .select(`
          *,
          product_variants(*),
          product_categories(
            categories(name, slug)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      const csvData = products.map(product => {
        const variant = product.product_variants?.[0]
        const category = product.product_categories?.[0]?.categories

        return {
          'Product ID': product.id,
          'Title': product.title,
          'Slug': product.slug,
          'Description': product.description || '',
          'Price': product.price,
          'Compare Price': product.compare_price || '',
          'SKU': variant?.sku || '',
          'Stock': product.global_stock || variant?.stock || 0,
          'Category': category?.name || '',
          'Status': product.status || 'draft',
          'Created At': new Date(product.created_at).toLocaleDateString()
        }
      })

      return { success: true, data: csvData }
    } catch (error) {
      console.error('Error exporting products:', error)
      return { success: false, error: 'Failed to export products' }
    }
  }

  /**
   * Track product view
   */
  static async trackView(productId: string) {
    try {
      const { data: analytics, error: fetchError } = await supabaseAdmin
        .from('product_analytics')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (analytics) {
        // Update existing
        await supabaseAdmin
          .from('product_analytics')
          .update({
            view_count: analytics.view_count + 1,
            last_viewed_at: new Date().toISOString()
          })
          .eq('product_id', productId)
      } else {
        // Create new
        await supabaseAdmin
          .from('product_analytics')
          .insert([{
            product_id: productId,
            view_count: 1,
            add_to_cart_count: 0,
            purchase_count: 0,
            total_revenue: 0,
            last_viewed_at: new Date().toISOString()
          }])
      }

      return { success: true }
    } catch (error) {
      console.error('Error tracking view:', error)
      return { success: false }
    }
  }

  /**
   * Track add to cart
   */
  static async trackAddToCart(productId: string) {
    try {
      const { data: analytics } = await supabaseAdmin
        .from('product_analytics')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (analytics) {
        await supabaseAdmin
          .from('product_analytics')
          .update({
            add_to_cart_count: analytics.add_to_cart_count + 1
          })
          .eq('product_id', productId)
      }

      return { success: true }
    } catch (error) {
      console.error('Error tracking add to cart:', error)
      return { success: false }
    }
  }

  /**
   * Get product analytics
   */
  static async getProductAnalytics(productId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('product_analytics')
        .select('*')
        .eq('product_id', productId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      const analytics = data || {
        product_id: productId,
        view_count: 0,
        add_to_cart_count: 0,
        purchase_count: 0,
        total_revenue: 0,
        conversion_rate: 0
      }

      // Calculate conversion rate
      if (analytics.view_count > 0) {
        analytics.conversion_rate = (analytics.purchase_count / analytics.view_count) * 100
      }

      return { success: true, data: analytics }
    } catch (error) {
      console.error('Error fetching product analytics:', error)
      return { success: false, error: 'Failed to fetch analytics' }
    }
  }

  /**
   * Calculate SEO score
   */
  static calculateSEOScore(product: any): number {
    let score = 0

    // Title (20 points)
    if (product.title && product.title.length >= 10 && product.title.length <= 60) {
      score += 20
    } else if (product.title) {
      score += 10
    }

    // Description (20 points)
    if (product.description && product.description.length >= 150) {
      score += 20
    } else if (product.description && product.description.length >= 50) {
      score += 10
    }

    // Meta title (15 points)
    if (product.meta_title && product.meta_title.length >= 30 && product.meta_title.length <= 60) {
      score += 15
    } else if (product.meta_title) {
      score += 7
    }

    // Meta description (15 points)
    if (product.meta_description && product.meta_description.length >= 120 && product.meta_description.length <= 160) {
      score += 15
    } else if (product.meta_description) {
      score += 7
    }

    // Slug (10 points)
    if (product.slug && product.slug.length >= 3 && !product.slug.includes('_')) {
      score += 10
    }

    // Images (10 points)
    if (product.product_images && product.product_images.length >= 3) {
      score += 10
    } else if (product.product_images && product.product_images.length >= 1) {
      score += 5
    }

    // Categories (10 points)
    if (product.product_categories && product.product_categories.length >= 1) {
      score += 10
    }

    return score
  }

  /**
   * Update product SEO
   */
  static async updateProductSEO(productId: string, seo: ProductSEO) {
    try {
      const { error } = await supabaseAdmin
        .from('products')
        .update({
          meta_title: seo.meta_title,
          meta_description: seo.meta_description,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Error updating product SEO:', error)
      return { success: false, error: 'Failed to update SEO' }
    }
  }
}
