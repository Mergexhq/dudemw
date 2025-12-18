import { supabase } from '@/lib/supabase/client'
import { supabaseAdmin } from '@/lib/supabase/supabase'

export interface Collection {
  id: string
  title: string
  slug: string
  description?: string
  type: string
  is_active: boolean
  rule_json?: any
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
          collection_products(count)
        `)
        .order('created_at', { ascending: false })

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching collections:', error)
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

      if (error) throw error

      return { success: true, data: collection }
    } catch (error) {
      console.error('Error fetching collection:', error)
      return { success: false, error: 'Failed to fetch collection' }
    }
  }

  /**
   * Get products in a collection
   */
  static async getCollectionProducts(collectionId: string, limit?: number) {
    try {
      let query = supabase
        .from('collection_products')
        .select(`
          *,
          product:products (
            *,
            product_images (
              id,
              image_url,
              alt_text,
              is_primary
            )
          )
        `)
        .eq('collection_id', collectionId)
        .order('sort_order', { ascending: true })

      if (limit) {
        query = query.limit(limit)
      }

      const { data, error } = await query

      if (error) throw error

      // Extract products from the junction table
      const products = data?.map(cp => cp.product).filter(Boolean) || []

      return { success: true, data: products }
    } catch (error) {
      console.error('Error fetching collection products:', error)
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
          products: productsResult.data,
          product_count: productsResult.data.length
        }
      }
    } catch (error) {
      console.error('Error fetching collection with products:', error)
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
          collection_products(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Error fetching featured collections:', error)
      return { success: false, error: 'Failed to fetch featured collections' }
    }
  }
}
