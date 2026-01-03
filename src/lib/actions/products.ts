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
    console.log('=== Starting Product Creation ===')
    console.log('Product title:', productData.title)
    console.log('Variant mode:', productData.variants && productData.variants.length > 0 ? 'variants' : 'single')

    // Validate required fields
    if (!productData.title || productData.title.trim() === '') {
      throw new Error('Product title is required')
    }

    // Validate single product mode requirements
    const hasSingleMode = !productData.variants || productData.variants.length === 0
    if (hasSingleMode) {
      console.log('Single product mode - validating pricing...')
      console.log('Price received:', productData.price)
      console.log('Global stock received:', productData.global_stock)

      // For single products, price is typically required
      // But we'll allow it to be optional and let the database handle it
      if (productData.price !== undefined && productData.price !== null && productData.price <= 0) {
        throw new Error('Product price must be greater than 0')
      }
    }

    // Generate slug from title if url_handle not provided
    const slug = productData.url_handle || productData.title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    console.log('Generated slug:', slug)

    // Prepare the product insert object, only including defined values
    const productInsertData: any = {
      title: productData.title.trim(),
      status: productData.status,
      highlights: productData.highlights || [],
      taxable: productData.taxable ?? true,
      track_inventory: productData.track_inventory ?? true,
      allow_backorders: productData.allow_backorders ?? false,
      low_stock_threshold: productData.low_stock_threshold ?? 5,
      slug: slug,
    }

    // Add optional fields only if they have values
    if (productData.subtitle) productInsertData.subtitle = productData.subtitle.trim()
    if (productData.description) productInsertData.description = productData.description.trim()
    if (productData.price !== undefined && productData.price !== null) productInsertData.price = productData.price
    if (productData.compare_price !== undefined && productData.compare_price !== null) productInsertData.compare_price = productData.compare_price
    // Note: 'cost' column does not exist in products table schema, so we skip it
    // if (productData.cost !== undefined && productData.cost !== null) productInsertData.cost = productData.cost
    if (productData.global_stock !== undefined && productData.global_stock !== null) productInsertData.global_stock = productData.global_stock
    if (productData.meta_title) productInsertData.meta_title = productData.meta_title.trim()
    if (productData.meta_description) productInsertData.meta_description = productData.meta_description.trim()
    if (productData.url_handle) productInsertData.url_handle = productData.url_handle.trim()

    console.log('Inserting product with data:', JSON.stringify(productInsertData, null, 2))

    // Create the main product
    console.log('Step 1: Creating main product record...')
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert(productInsertData)
      .select()
      .single()

    if (productError) {
      console.error('Product creation failed:', productError)
      throw new Error(`Failed to create product: ${productError.message || JSON.stringify(productError)}`)
    }

    if (!product) {
      throw new Error('Product was not created (no data returned)')
    }

    console.log('✅ Product created successfully with ID:', product.id)
    const productId = product.id

    // Create product images
    if (productData.images && productData.images.length > 0) {
      console.log(`Step 2: Creating ${productData.images.length} product image(s)...`)
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

        if (imagesError) {
          console.error('Failed to insert images:', imagesError)
          throw new Error(`Failed to add product images: ${imagesError.message}`)
        }
        console.log(`✅ Added ${imageInserts.length} product image(s)`)
      }
    }

    // Create product options and variants
    if (productData.options && productData.options.length > 0) {
      console.log(`Step 3: Creating ${productData.options.length} product option(s)...`)
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

        if (optionError) {
          console.error('Failed to create option:', optionError)
          throw new Error(`Failed to create product option "${option.name}": ${optionError.message}`)
        }

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

        if (optionValuesError) {
          console.error('Failed to create option values:', optionValuesError)
          throw new Error(`Failed to create values for option "${option.name}": ${optionValuesError.message}`)
        }
        console.log(`  ✅ Created option "${option.name}" with ${option.values.length} value(s)`)
      }
    }

    // Create product variants
    if (productData.variants && productData.variants.length > 0) {
      console.log(`Step 4: Creating ${productData.variants.length} product variant(s)...`)
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

        if (variantError) {
          console.error('Failed to create variant:', variantError)
          throw new Error(`Failed to create variant "${variant.name}": ${variantError.message}`)
        }

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

        if (inventoryError) {
          console.error('Failed to create inventory item:', inventoryError)
          throw new Error(`Failed to create inventory for variant "${variant.name}": ${inventoryError.message}`)
        }

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
        console.log(`  ✅ Created variant "${variant.name}"`)
      }
    }

    // Link to categories
    if (productData.categoryIds && productData.categoryIds.length > 0) {
      console.log(`Step 5: Linking to ${productData.categoryIds.length} category/categories...`)
      const categoryInserts = productData.categoryIds.map(categoryId => ({
        product_id: productId,
        category_id: categoryId,
      }))

      const { error: categoriesError } = await supabaseAdmin
        .from('product_categories')
        .insert(categoryInserts)

      if (categoriesError) {
        console.error('Failed to link categories:', categoriesError)
        throw new Error(`Failed to link categories: ${categoriesError.message}`)
      }
      console.log('✅ Categories linked successfully')
    }

    // Link to collections
    if (productData.collectionIds && productData.collectionIds.length > 0) {
      console.log(`Step 6: Linking to ${productData.collectionIds.length} collection(s)...`)
      const collectionInserts = productData.collectionIds.map((collectionId, index) => ({
        product_id: productId,
        collection_id: collectionId,
        position: index,
      }))

      const { error: collectionsError } = await supabaseAdmin
        .from('product_collections')
        .insert(collectionInserts)

      if (collectionsError) {
        console.error('Failed to link collections:', collectionsError)
        throw new Error(`Failed to link collections: ${collectionsError.message}`)
      }
      console.log('✅ Collections linked successfully')
    }

    // Create and link tags
    if (productData.tags && productData.tags.length > 0) {
      console.log(`Step 7: Creating and linking ${productData.tags.length} tag(s)...`)
      for (const tagName of productData.tags) {
        const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

        // Upsert tag
        const { data: tag, error: tagError } = await supabaseAdmin
          .from('product_tags')
          .upsert({
            name: tagName,
            slug: tagSlug,
          }, {
            onConflict: 'slug'
          })
          .select()
          .single()

        if (tagError) {
          console.error('Failed to create/update tag:', tagError)
          throw new Error(`Failed to create tag "${tagName}": ${tagError.message}`)
        }

        // Link product to tag
        const { error: tagAssignmentError } = await supabaseAdmin
          .from('product_tag_assignments')
          .insert({
            product_id: productId,
            tag_id: tag.id,
          })

        if (tagAssignmentError) {
          console.error('Failed to link tag:', tagAssignmentError)
          throw new Error(`Failed to link tag "${tagName}": ${tagAssignmentError.message}`)
        }
      }
      console.log('✅ Tags created and linked successfully')
    }

    console.log('=== Product Creation Complete ===')
    revalidatePath('/admin/products')
    return { success: true, data: product }
  } catch (error) {
    // Enhanced error logging for debugging
    console.error('=== Product Creation Error ===')
    console.error('Error object:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    // Check if it's a Supabase/PostgreSQL error
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Database error code:', (error as any).code)
      console.error('Database error details:', (error as any).details)
      console.error('Database error hint:', (error as any).hint)
    }
    console.error('==============================')

    // Return detailed error message for debugging
    const errorMessage = error instanceof Error ? error.message : 'Failed to create product'
    return { success: false, error: errorMessage }
  }
}

export async function getProducts(filters?: {
  search?: string
  category?: string
  status?: string
  stock_status?: string
  price?: { min?: number; max?: number }
  created_at?: { from?: string; to?: string }
}) {
  try {
    let query

    // Use RPC if searching, otherwise standard table select
    if (filters?.search) {
      query = (supabaseAdmin as any).rpc('admin_search_products', { search_term: filters.search })
    } else {
      query = supabaseAdmin.from('products')
    }

    // Chain the select with relationships
    // Note: RPC returning SETOF products allows relationship embedding just like table select
    query = query.select(`
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

    // Apply status filter
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }

    // Apply category filter
    if (filters?.category) {
      query = query.eq('product_categories.category_id', filters.category)
    }

    // Apply price range filter
    if (filters?.price) {
      if (filters.price.min !== undefined && filters.price.min !== null) {
        query = query.gte('price', filters.price.min)
      }
      if (filters.price.max !== undefined && filters.price.max !== null) {
        query = query.lte('price', filters.price.max)
      }
    }

    // Apply date range filter
    if (filters?.created_at) {
      if (filters.created_at.from) {
        query = query.gte('created_at', filters.created_at.from)
      }
      if (filters.created_at.to) {
        query = query.lte('created_at', filters.created_at.to)
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // Apply stock filter on the client side since it requires calculation
    let filteredData = data
    if (filters?.stock_status) {
      filteredData = data?.filter((product: any) => {
        const totalStock = product.global_stock ||
          product.product_variants?.reduce((sum: number, variant: any) => sum + (variant.stock || 0), 0) || 0

        switch (filters.stock_status) {
          case 'in_stock':
            return totalStock > 0
          case 'low_stock':
            return totalStock > 0 && totalStock < 10
          case 'out_of_stock':
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
    // First, check if any variants of this product are referenced in orders
    const { data: variants } = await supabaseAdmin
      .from('product_variants')
      .select('id')
      .eq('product_id', id)

    if (variants && variants.length > 0) {
      const variantIds = variants.map(v => v.id)

      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('id')
        .in('variant_id', variantIds)
        .limit(1)

      // If product has orders, prevent deletion
      if (orderItems && orderItems.length > 0) {
        return {
          success: false,
          error: 'Cannot delete product with existing orders. Archive it instead to hide it from your store.',
          hasOrders: true
        }
      }
    }

    // No orders found, proceed with deletion
    const { error } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/admin/products')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting product:', error)

    // Check if it's a foreign key constraint error
    if (error.code === '23503') {
      return {
        success: false,
        error: 'Cannot delete product with existing orders. Archive it instead to hide it from your store.',
        hasOrders: true
      }
    }

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
