'use client'

import { useEffect, useState } from 'react'
import { CacheService } from '@/lib/services/redis'
import type { Product } from '@/domains/product'
import ProductGridSection from "@/domains/product/sections/ProductGridSection"
import BannerCarousel from '@/domains/product/components/banners/BannerCarousel'
import CategoryGrid from '../sections/CategoryGrid'
import InstagramFeed from '../sections/InstagramFeed'
import WhyDudeSection from '../sections/WhyDudeSection'
import GoogleReviewsSection from '../sections/GoogleReviewsSection'
import { getCollectionWithProductDetailsAction } from '@/lib/actions/collections'
import { getProducts } from '@/lib/actions/products'

interface CollectionWithProducts {
  id: string
  title: string
  description?: string | null
  slug: string
  products: Product[]
}

export default function DynamicHomepage() {
  const [collections, setCollections] = useState<CollectionWithProducts[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCollections()
  }, [])

  const loadCollections = async () => {
    try {
      setLoading(true)

      // Try to get from cache first
      const cached = await CacheService.getCachedHomepageData('collections')
      if (cached) {
        setCollections(cached)
        setLoading(false)
        return
      }

      // Fetch all published products — we'll filter by collection from server actions
      // Use getProducts to get products, and getCollectionWithProductDetailsAction for each collection
      const productsResult = await getProducts({ status: 'published', limit: 100 })

      if (productsResult.success && productsResult.data) {
        // Group by collections from product_collections
        const allProducts = productsResult.data as any[]

        // Extract unique collections from products
        const collectionMap = new Map<string, CollectionWithProducts>()

        for (const product of allProducts) {
          if (product.product_collections) {
            for (const pc of product.product_collections) {
              const col = pc.collections
              if (col && col.is_active) {
                if (!collectionMap.has(col.id)) {
                  collectionMap.set(col.id, {
                    id: col.id,
                    title: col.title,
                    description: col.description,
                    slug: col.slug,
                    products: []
                  })
                }
                collectionMap.get(col.id)!.products.push(product)
              }
            }
          }
        }

        const collectionsWithProducts = Array.from(collectionMap.values())
          .filter(c => c.products.length > 0)
          .slice(0, 4)
          .map(c => ({ ...c, products: c.products.slice(0, 12) }))

        setCollections(collectionsWithProducts)

        // Cache the result for 10 minutes
        if (collectionsWithProducts.length > 0) {
          await CacheService.cacheHomepageData('collections', collectionsWithProducts)
        }
      }
    } catch (err) {
      console.error('Failed to load collections:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 1. BANNER SECTION */}
      <BannerCarousel />

      {/* 2. CATEGORY GRID SECTION */}
      <CategoryGrid />

      {/* 3. COLLECTIONS SECTION */}
      {collections.length > 0 && (
        <section className="bg-white py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="space-y-12">
              {collections.map((collection, index) => (
                <ProductGridSection
                  key={collection.id}
                  title={collection.title}
                  description={collection.description}
                  products={collection.products}
                  badge={index === 0 ? 'NEW' : undefined}
                  badgeColor={index === 0 ? 'red' : 'black'}
                  centerHeader={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Loading state for collections */}
      {loading && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="animate-pulse space-y-8">
              <div className="h-8 w-48 bg-gray-200 rounded" />
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-64 h-80 bg-gray-200 rounded-lg flex-shrink-0" />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. INSTAGRAM SECTION */}
      <InstagramFeed />

      {/* 5. GOOGLE REVIEWS SECTION */}
      <GoogleReviewsSection />

      {/* 6. WHY DUDE SECTION */}
      <WhyDudeSection />
    </div>
  )
}
