import { prisma } from '@/lib/db'

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
  /** Get all active collections */
  static async getCollections(activeOnly = true) {
    try {
      const data = await prisma.collections.findMany({
        where: activeOnly ? { is_active: true } : undefined,
        include: { _count: { select: { product_collections: true } } },
        orderBy: { created_at: 'desc' },
      })
      return { success: true, data: data || [] }
    } catch (error: any) {
      console.error('Error fetching collections:', error?.message)
      return { success: false, error: 'Failed to fetch collections' }
    }
  }

  /** Get a single collection by ID or slug */
  static async getCollection(identifier: string, bySlug = false) {
    try {
      const data = await prisma.collections.findUnique({
        where: bySlug ? { slug: identifier } : { id: identifier },
      })
      if (!data) return { success: false, error: 'Collection not found', notFound: true }
      return { success: true, data }
    } catch (error: any) {
      console.error('Error fetching collection:', error?.message)
      return { success: false, error: 'Failed to fetch collection' }
    }
  }

  /** Get products in a collection */
  static async getCollectionProducts(collectionId: string, limit?: number) {
    try {
      const rows = await prisma.product_collections.findMany({
        where: { collection_id: collectionId },
        include: {
          products: {
            include: {
              product_images: true,
              product_variants: { where: { active: true } },
            },
          },
        },
        orderBy: { position: 'asc' },
        take: limit,
      })

      const products = rows.map(r => r.products).filter(Boolean)
      return { success: true, data: products }
    } catch (error: any) {
      console.error('Error fetching collection products:', error?.message)
      return { success: false, error: 'Failed to fetch collection products' }
    }
  }

  /** Get collection with products */
  static async getCollectionWithProducts(identifier: string, bySlug = false, limit?: number) {
    try {
      const collectionResult = await this.getCollection(identifier, bySlug)
      if (!collectionResult.success || !collectionResult.data) return collectionResult

      const collection = collectionResult.data
      const productsResult = await this.getCollectionProducts(collection.id, limit)
      if (!productsResult.success) return productsResult

      return {
        success: true,
        data: {
          ...collection,
          products: productsResult.data || [],
          product_count: (productsResult.data || []).length,
        },
      }
    } catch (error: any) {
      console.error('Error fetching collection with products:', error?.message)
      return { success: false, error: 'Failed to fetch collection with products' }
    }
  }

  /** Get featured collections */
  static async getFeaturedCollections(limit = 6) {
    try {
      const data = await prisma.collections.findMany({
        where: { is_active: true },
        include: { _count: { select: { product_collections: true } } },
        orderBy: { created_at: 'desc' },
        take: limit,
      })
      return { success: true, data: data || [] }
    } catch (error: any) {
      console.error('Error fetching featured collections:', error?.message)
      return { success: false, error: 'Failed to fetch featured collections' }
    }
  }
}
