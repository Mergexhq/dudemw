'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CacheService } from '@/lib/services/redis'
import type { Product } from '@/domains/product'
import HorizontalProductScroll from '@/domains/product/components/cards/HorizontalProductScroll'
import BannerCarousel from '@/domains/product/components/banners/BannerCarousel'
import CategoryGrid from '../sections/CategoryGrid'
import InstagramFeed from '../sections/InstagramFeed'
import WhyDudeSection from '../sections/WhyDudeSection'
import { transformProducts } from '@/domains/product/utils/productUtils'

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

      const supabase = createClient()

      // Fetch collections from database
      const { data: collectionsData } = await supabase
        .from('collections')
        .select('id, title, slug, description')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4)

      // Fetch products for each collection
      const collectionsWithProducts: CollectionWithProducts[] = []

      if (collectionsData && collectionsData.length > 0) {
        for (const col of collectionsData) {
          // Fetch collection products directly with client-side Supabase
          const { data: collectionProducts } = await supabase
            .from('product_collections')
            .select(`
              *,
              product:products (
                *,
                product_images (*),
                product_variants!product_variants_product_id_fkey(
                  *,
                  variant_images (
                    id,
                    image_url,
                    alt_text,
                    position
                  )
                ),
                default_variant:product_variants!products_default_variant_id_fkey(
                  *,
                  variant_images (
                    id,
                    image_url,
                    alt_text,
                    position
                  )
                )
              )
            `)
            .eq('collection_id', col.id)
            .order('position', { ascending: true })
            .limit(8)

          const products = collectionProducts?.map(cp => cp.product).filter(Boolean) || []

          if (products.length > 0) {
            collectionsWithProducts.push({
              id: col.id,
              title: col.title,
              description: col.description,
              slug: col.slug,
              products: transformProducts(products).slice(0, 8)
            })
          }
        }
      }

      setCollections(collectionsWithProducts)

      // Cache the result for 10 minutes
      if (collectionsWithProducts.length > 0) {
        await CacheService.cacheHomepageData('collections', collectionsWithProducts)
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
                <HorizontalProductScroll
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

      {/* 4. WHY DUDE SECTION */}
      <WhyDudeSection />

      {/* 5. INSTAGRAM SECTION */}
      <InstagramFeed />
    </div>
  )
}
