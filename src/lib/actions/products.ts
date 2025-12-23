"use server"

import { supabaseAdmin } from '@/lib/supabase/supabase'
import { Database } from '@/types/database'
import { revalidatePath } from 'next/cache'

// Image upload function
export async function uploadProductImage(file: File): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `products/${fileName}`

    const { data, error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return { success: true, url: publicUrl }
  } catch (error) {
    console.error('Error uploading image:', error)
    return { success: false, error: 'Failed to upload image' }
  }
}

type Product = Database['public']['Tables']['products']['Row']
type ProductInsert = Database['public']['Tables']['products']['Insert']
type ProductUpdate = Database['public']['Tables']['products']['Update']
type ProductVariant = Database['public']['Tables']['product_variants']['Row']
type ProductImage = Database['public']['Tables']['product_images']['Row']
type ProductOption = Database['public']['Tables']['product_options']['Row']
type ProductOptionValue = Database['public']['Tables']['product_option_values']['Row']

// Product CRUD Operations
export async function createProduct(productData: {
  // General
  title: string
  subtitle?: string
  description?: string
  highlights?: string[]
  status: 'draft' | 'published' | 'archived'

  // Pricing
  price?: number
  compare_price?: number
  cost?: number
  taxable?: boolean

  // Inventory
  track_inventory?: boolean
  allow_backorders?: boolean
  low_stock_threshold?: number
  global_stock?: number

  // SEO
  meta_title?: string
  meta_description?: string
  url_handle?: string

  // Images
  images?: { url: string; alt: string; isPrimary: boolean }[]

  // Options and Variants
  options?: { name: string; values: { name: string; hexColor?: string }[] }[]
  variants?: {
    name: string
    sku: string
    price: number
    comparePrice?: number
    stock: number
    active: boolean
    combinations: { [optionName: string]: string }
  }[]

  // Organization
  categoryIds?: string[]
  collectionIds?: string[]
  tags?: string[]
}) {
  try {
    // Generate slug from title if url_handle not provided
    const slug = productData.url_handle || productData.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Create the main product
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        title: productData.title,
        subtitle: productData.subtitle,
        description: productData.description,
        highlights: productData.highlights || [],
        status: productData.status,
        price: productData.price || 0,
        compare_price: productData.compare_price,
        cost: productData.cost,
        taxable: productData.taxable ?? true,
        track_inventory: productData.track_inventory ?? true,
        allow_backorders: productData.allow_backorders ?? false,
        low_stock_threshold: productData.low_stock_threshold ?? 5,
        global_stock: productData.global_stock ?? 0,
        meta_title: productData.meta_title,
        meta_description: productData.meta_description,
        url_handle: productData.url_handle,
        slug: slug,
      })
      .select()
      .single()

    if (productError) throw productError

    const productId = product.id

    // Create product images
    if (productData.images && productData.images.length > 0) {
      const imageInserts = []

      for (const [index, img] of productData.images.entries()) {
        // Skip blob URLs - images should be uploaded before calling this function
        if (img.url.startsWith('blob:')) {
          console.warn('Blob URL detected, skipping:', img.url)
          continue
        }

        imageInserts.push({
          product_id: productId,
          image_url: img.url,
          alt_text: img.alt,
          is_primary: img.isPrimary,
          sort_order: index,
        })
      }

      if (imageInserts.length > 0) {
        const { error: imagesError } = await supabaseAdmin
          .from('product_images')
          .insert(imageInserts)

        if (imagesError) throw imagesError
      }
    }

    // Create product options and variants
    if (productData.options && productData.options.length > 0) {
      for (const [optionIndex, option] of productData.options.entries()) {
        // Create option
        const { data: createdOption, error: optionError } = await supabaseAdmin
          .from('product_options')
          .insert({
            product_id: productId,
            name: option.name,
            position: optionIndex,
          })
          .select()
          .single()

        if (optionError) throw optionError

        // Create option values
        const optionValueInserts = option.values.map((value, valueIndex) => ({
          option_id: createdOption.id,
          name: value.name,
          hex_color: value.hexColor,
          position: valueIndex,
        }))

        const { error: optionValuesError } = await supabaseAdmin
          .from('product_option_values')
          .insert(optionValueInserts)

        if (optionValuesError) throw optionValuesError
      }
    }

    // Create product variants
    if (productData.variants && productData.variants.length > 0) {
      for (const [variantIndex, variant] of productData.variants.entries()) {
        const { data: createdVariant, error: variantError } = await supabaseAdmin
          .from('product_variants')
          .insert({
            product_id: productId,
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            discount_price: variant.comparePrice,
            stock: variant.stock,
            active: variant.active,
            position: variantIndex,
          })
          .select()
          .single()

        if (variantError) throw variantError

        // Create inventory item for this variant
        const { error: inventoryError } = await supabaseAdmin
          .from('inventory_items')
          .insert({
            variant_id: createdVariant.id,
            sku: variant.sku,
            quantity: variant.stock,
            track_quantity: productData.track_inventory ?? true,
            allow_backorders: productData.allow_backorders ?? false,
            low_stock_threshold: productData.low_stock_threshold ?? 5,
          })

        if (inventoryError) throw inventoryError

        // Link variant to option values based on combinations
        if (productData.options) {
          for (const [optionName, valueName] of Object.entries(variant.combinations)) {
            // Find the option first
            const { data: optionData } = await supabaseAdmin
              .from('product_options')
              .select('id')
              .eq('product_id', productId)
              .eq('name', optionName)
              .single()

            if (optionData) {
              // Then find the option value
              const { data: optionValueData } = await supabaseAdmin
                .from('product_option_values')
                .select('id')
                .eq('option_id', optionData.id)
                .eq('name', valueName)
                .single()

              if (optionValueData) {
                await supabaseAdmin
                  .from('variant_option_values')
                  .insert({
                    variant_id: createdVariant.id,
                    option_value_id: optionValueData.id,
                  })
              }
            }
          }
        }
      }
    }

    // Link to categories
    if (productData.categoryIds && productData.categoryIds.length > 0) {
      const categoryInserts = productData.categoryIds.map(categoryId => ({
        product_id: productId,
        category_id: categoryId,
      }))

      const { error: categoriesError } = await supabaseAdmin
        .from('product_categories')
        .insert(categoryInserts)

      if (categoriesError) throw categoriesError
    }

    // Link to collections
    if (productData.collectionIds && productData.collectionIds.length > 0) {
      const collectionInserts = productData.collectionIds.map((collectionId, index) => ({
        product_id: productId,
        collection_id: collectionId,
        position: index,
      }))

      const { error: collectionsError } = await supabaseAdmin
        .from('product_collections')
        .insert(collectionInserts)

      if (collectionsError) throw collectionsError
    }

    // Create and link tags
    if (productData.tags && productData.tags.length > 0) {
      for (const tagName of productData.tags) {
        const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

        // Upsert tag
        const { data: tag, error: tagError } = await supabaseAdmin
          .from('product_tags')
          .upsert({
            name: tagName,
            slug: tagSlug,
          })
          .select()
          .single()

        if (tagError) throw tagError

        // Link product to tag
        const { error: tagAssignmentError } = await supabaseAdmin
          .from('product_tag_assignments')
          .insert({
            product_id: productId,
            tag_id: tag.id,
          })

        if (tagAssignmentError) throw tagAssignmentError
      }
    }

    revalidatePath('/admin/products')
    return { success: true, data: product }
  } catch (error) {
    console.error('Error creating product:', error)
    return { success: false, error: 'Failed to create product' }
  }
}

export async function getProducts(filters?: {
  search?: string
  categoryId?: string
  status?: string
  stockStatus?: string
}) {
  try {
    let query = supabaseAdmin
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
        product_variants!product_variants_product_id_fkey (
          id,
          name,
          sku,
          price,
          discount_price,
          stock,
          active,
          image_url,
          variant_images (
            id,
            image_url,
            alt_text,
            position
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
        )
      `)

    // Apply filters
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`)
    }

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.categoryId && filters.categoryId !== 'all') {
      query = query.eq('product_categories.category_id', filters.categoryId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // Apply stock filter on the client side since it requires calculation
    let filteredData = data
    if (filters?.stockStatus && filters.stockStatus !== 'all') {
      filteredData = data?.filter(product => {
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

    return { success: true, data: filteredData }
  } catch (error) {
    console.error('Error fetching products:', error)
    return { success: false, error: 'Failed to fetch products' }
  }
}

export async function getProduct(id: string) {
  try {
    // Validate input
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid product ID provided')
    }

    console.log('Fetching product with ID:', id)

    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        product_images (
          id,
          image_url,
          alt_text,
          is_primary,
          sort_order,
          width,
          height
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
        product_variants!product_variants_product_id_fkey (
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
          ),
          variant_images (
            id,
            image_url,
            alt_text,
            position
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
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    if (!data) {
      console.log('No product found with ID:', id)
      return { success: false, error: 'Product not found' }
    }

    console.log('Product fetched successfully:', data.id)
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching product:', {
      productId: id,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch product'
    }
  }
}

// Update Product function extended to handle relationships
export async function updateProduct(id: string, updates: ProductUpdate & {
  categoryIds?: string[]
  collectionIds?: string[]
  tags?: string[]
  newImage?: string
  default_variant_id?: string | null
}) {
  try {
    // Separate relationships from product fields
    const { categoryIds, collectionIds, tags, newImage, default_variant_id, ...productFields } = updates

    // 1. Update product fields (including default_variant_id)
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ ...productFields, default_variant_id })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // 2. Update Categories
    if (categoryIds !== undefined) {
      // Delete existing
      await supabaseAdmin
        .from('product_categories')
        .delete()
        .eq('product_id', id)

      // Insert new
      if (categoryIds.length > 0) {
        const categoryInserts = categoryIds.map((categoryId: string) => ({
          product_id: id,
          category_id: categoryId,
        }))

        const { error: catError } = await supabaseAdmin
          .from('product_categories')
          .insert(categoryInserts)

        if (catError) throw catError
      }
    }

    // 3. Update Collections
    if (collectionIds !== undefined) {
      // Delete existing
      await supabaseAdmin
        .from('product_collections')
        .delete()
        .eq('product_id', id)

      // Insert new
      if (collectionIds.length > 0) {
        const collectionInserts = collectionIds.map((collectionId: string, index: number) => ({
          product_id: id,
          collection_id: collectionId,
          position: index,
        }))

        const { error: colError } = await supabaseAdmin
          .from('product_collections')
          .insert(collectionInserts)

        if (colError) throw colError
      }
    }

    // 4. Update Tags (Optional - can be added if needed based on UI)
    // For now skipping to keep scope focused on user request

    // 5. Handle New Image
    if (newImage) {
      // First, unset existing primary images
      await supabaseAdmin
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', id)

      // Insert new image as primary
      const { error: imageError } = await supabaseAdmin
        .from('product_images')
        .insert({
          product_id: id,
          image_url: newImage,
          alt_text: productFields.title || 'Product Image', // Fallback to title
          is_primary: true,
          sort_order: 0
        })

      if (imageError) throw imageError
    }

    // Revalidate Admin Paths
    revalidatePath('/admin/products')
    revalidatePath(`/admin/products/${id}`)

    // Revalidate Storefront Paths
    // We need the slug to revalidate the specific product page. Use updated slug if available, otherwise fetch current.
    let slug = productFields.slug || productFields.url_handle
    if (!slug) {
      // If slug wasn't updated, we already have the product data from step 1 (returned in 'data')
      slug = data.slug
    }

    if (slug) {
      revalidatePath(`/products/${slug}`)
      revalidatePath('/products') // Revalidate listing page
      revalidatePath('/') // Revalidate home page (featured/new arrivals)
    }
    return { success: true, data }
  } catch (error) {
    console.error('Error updating product:', error)
    return { success: false, error: 'Failed to update product' }
  }
}

export async function deleteProduct(id: string) {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/products')
    return { success: true }
  } catch (error) {
    console.error('Error deleting product:', error)
    return { success: false, error: 'Failed to delete product' }
  }
}

// Helper functions for dropdowns
export async function getCategories() {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('id, name, slug, parent_id')
      .order('name')

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { success: false, error: 'Failed to fetch categories' }
  }
}

export async function getCollections() {
  try {
    const { data, error } = await supabaseAdmin
      .from('collections')
      .select('id, title, slug, type')
      .eq('is_active', true)
      .order('title')

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching collections:', error)
    return { success: false, error: 'Failed to fetch collections' }
  }
}

export async function getTags() {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_tags')
      .select('id, name, slug')
      .order('name')

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error fetching tags:', error)
    return { success: false, error: 'Failed to fetch tags' }
  }
}
