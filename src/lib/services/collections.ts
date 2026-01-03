import { supabaseAdmin as supabase } from '@/lib/supabase/supabase'

export interface Collection {
  id: string
  title: string
  slug: string
  description?: string
  type: string
  is_active: boolean
  rule_json?: any
  image_url?: string | null
  created_at: string
  updated_at: string
}

export interface CollectionWithProducts extends Collection {
  products: any[]
  product_count: number
}

export class CollectionService {
  /**
   * Get all active collections
   */
  static async getCollections(activeOnly = true) {
    try {
      let query = supabase
        .from('collections')
        .select(`
          *,
          product_collections(count)
        `)
        .order('created_at', { ascending: false })

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching collections:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      return { success: true, data: data || [] }
    } catch (error: any) {
      console.error('Error fetching collections:', {
        message: error?.message || 'Unknown error'
      })
      return { success: false, error: 'Failed to fetch collections' }
    }
  }

  /**
   * Get a single collection by ID or slug
   */
  static async getCollection(identifier: string, bySlug = false) {
    try {
      let query = supabase
        .from('collections')
        .select(`
          *
        `)

      if (bySlug) {
        query = query.eq('slug', identifier)
      } else {
        query = query.eq('id', identifier)
      }

      const { data: collection, error } = await query.single()

      if (error) {
        // PGRST116 means no rows found - this is expected when collection doesn't exist
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Collection not found', notFound: true }
        }

        console.error('Error fetching collection:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          identifier,
          bySlug
        })
        throw error
      }

      return { success: true, data: collection }
    } catch (error: any) {
      console.error('Error fetching collection:', {
        message: error?.message || 'Unknown error',
        identifier,
        bySlug
      })
      return { success: false, error: 'Failed to fetch collection' }
    }
  }

  /**
   * Get products in a collection
   */
  static async getCollectionProducts(collectionId: string, limit?: number) {
    try {
      let query = supabase
        .from('product_collections')
        .select(`
          *,
          product:products (
            *,
            product_images (*),
            product_variants!product_variants_product_id_fkey(*),
            default_variant:product_variants!products_default_variant_id_fkey(*)
          )
        `)
        .eq('collection_id', collectionId)
        .order('position', { ascending: true })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching collection products:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          collectionId
        })
        throw error
      }

      // Extract products from the junction table
      const products = data?.map(cp => cp.product).filter(Boolean) || []

      return { success: true, data: products }
    } catch (error: any) {
      console.error('Error fetching collection products:', {
        message: error?.message || 'Unknown error',
        collectionId
      })
      return { success: false, error: 'Failed to fetch collection products' }
    }
  }

  /**
   * Get collection with products
   */
  static async getCollectionWithProducts(identifier: string, bySlug = false, limit?: number) {
    try {
      // Get collection details
      const collectionResult = await this.getCollection(identifier, bySlug)
      if (!collectionResult.success || !collectionResult.data) {
        return collectionResult
      }

      const collection = collectionResult.data

      // Get products in collection
      const productsResult = await this.getCollectionProducts(collection.id, limit)
      if (!productsResult.success) {
        return productsResult
      }

      return {
        success: true,
        data: {
          ...collection,
          products: productsResult.data || [],
          product_count: (productsResult.data || []).length
        }
      }
    } catch (error: any) {
      console.error('Error fetching collection with products:', {
        message: error?.message || 'Unknown error',
        identifier,
        bySlug
      })
      return { success: false, error: 'Failed to fetch collection with products' }
    }
  }

  /**
   * Get featured collections
   */
  static async getFeaturedCollections(limit = 6) {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select(`
          *,
          product_collections(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('Error fetching featured collections:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      return { success: true, data: data || [] }
    } catch (error: any) {
      console.error('Error fetching featured collections:', {
        message: error?.message || 'Unknown error'
      })
      return { success: false, error: 'Failed to fetch featured collections' }
    }
  }
}
