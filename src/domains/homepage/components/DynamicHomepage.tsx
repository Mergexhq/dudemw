'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/supabase'
import { CollectionService } from '@/lib/services/collections'
import { ProductService } from '@/lib/services/products'
import type { HomepageSectionWithCollection } from '@/types/collections'
import type { Product } from '@/domains/product'
import HorizontalProductScroll from '@/domains/product/components/cards/HorizontalProductScroll'
import { ProductGrid } from '@/domains/product'
import { transformProducts } from '@/domains/product/utils/productUtils'

interface SectionWithProducts extends HomepageSectionWithCollection {
  products: Product[]
}

export default function DynamicHomepage() {
  const [sections, setSections] = useState<SectionWithProducts[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadHomepageContent()
  }, [])

  const loadHomepageContent = async () => {
    try {
      setLoading(true)
      
      // Fetch homepage sections from database
      const { data: homepageSections } = await supabase
        .from('homepage_sections')
        .select(`
          *,
          collection:collections(*)
        `)
        .eq('is_active', true)
        .order('position')

      // If no homepage sections, fetch all active products as fallback
      if (!homepageSections || homepageSections.length === 0) {
        const productsResult = await ProductService.getProducts({
          status: 'active',
          limit: 12
        })
        const products = productsResult.success ? transformProducts(productsResult.data) : []
        setAllProducts(products)
        setSections([])
        setLoading(false)
        return
      }

      // Load products for each section using CollectionService
      const sectionsWithProducts = await Promise.all(
        (homepageSections || []).map(async (section: any) => {
          if (!section.collection || !section.collection.id) {
            return { ...section, products: [] }
          }

          // Fetch products from the collection using CollectionService
          const productsResult = await CollectionService.getCollectionProducts(
            section.collection.id,
            8 // Limit to 8 products per section
          )

          const products = productsResult.success ? productsResult.data : []
          
          return { ...section, products }
        })
      )

      setSections(sectionsWithProducts)
    } catch (err) {
      console.error('Failed to load homepage content:', err)
      setError('Failed to load homepage content')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="space-y-12">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="mb-8 h-8 w-48 bg-gray-200 rounded mx-auto"></div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={loadHomepageContent}
            className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Fallback: Show all products when no homepage sections are configured
  if (sections.length === 0 && allProducts.length > 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="mb-12 text-center">
          <h1 className="font-heading text-4xl tracking-wider text-black md:text-5xl lg:text-6xl">
            Dude Menswear
          </h1>
          <p className="mt-4 font-body text-lg text-gray-600">
            Premium Fashion for the Modern Man
          </p>
        </div>

        {/* Display products in a grid */}
        <section className="mb-12">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-heading text-2xl tracking-wider text-black md:text-3xl">
              Featured Products
            </h2>
            <a
              href="/products"
              className="font-body text-sm font-medium text-red-600 hover:text-black transition-colors"
            >
              View All →
            </a>
          </div>
          <ProductGrid products={allProducts} />
        </section>

        {/* CTA Section */}
        <div className="text-center py-8 border-t border-gray-200">
          <a
            href="/products"
            className="inline-block px-8 py-3 bg-black text-white hover:bg-gray-800 transition-colors rounded-lg font-medium"
            data-testid="shop-all-cta"
          >
            Explore All Collections
          </a>
        </div>
      </div>
    )
  }

  if (sections.length === 0 && allProducts.length === 0) {
    // No sections and no products
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        <div className="text-center py-20">
          <h2 className="font-heading text-2xl text-gray-600 mb-4">
            Welcome to Dude Menswear
          </h2>
          <p className="text-gray-500">
            Our collection is being updated. Please check back soon!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
      <div className="space-y-12">
        {sections.map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
      </div>
    </div>
  )
}

function SectionRenderer({ section }: { section: SectionWithProducts }) {
  const getBadgeInfo = (collectionSlug?: string) => {
    switch (collectionSlug) {
      case 'new-arrivals':
        return { badge: 'NEW' as const, badgeColor: 'red' as const }
      case 'best-sellers':
        return { badge: 'BESTSELLER' as const, badgeColor: 'black' as const }
      default:
        return { badge: undefined, badgeColor: undefined }
    }
  }

  const { badge, badgeColor } = getBadgeInfo(section.collection?.slug)
  const viewAllLink = section.collection?.slug ? `/collections/${section.collection.slug}` : undefined

  if (section.layout === 'carousel') {
    return (
      <HorizontalProductScroll
        title={section.title}
        products={section.products}
        badge={badge}
        badgeColor={badgeColor}
        viewAllLink={viewAllLink}
      />
    )
  }

  if (section.layout === 'grid') {
    return (
      <section>
        <div className="mb-8 text-center">
          <h2 className="font-heading text-4xl tracking-wider text-black md:text-5xl">
            {section.title}
          </h2>
          {section.collection?.description && (
            <p className="mt-4 font-body text-gray-800">
              {section.collection.description}
            </p>
          )}
        </div>

        {section.products.length > 0 ? (
          <ProductGrid products={section.products} />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No products available in this collection.</p>
          </div>
        )}

        {viewAllLink && (
          <div className="mt-8 text-center">
            <a
              href={viewAllLink}
              className="inline-block px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors"
            >
              View All
            </a>
          </div>
        )}
      </section>
    )
  }

  // Banner layout (future implementation)
  return null
}
