'use client'

import { useEffect, useState } from 'react'
import { ProductGrid } from '@/domains/product'
import { CampaignSection } from '../types'
import { Product } from '@/domains/product'
import { createClient } from '@/lib/supabase/client'
import { transformProducts } from '@/domains/product/utils/productUtils'

interface SectionRendererProps {
  sections: CampaignSection[]
}

export default function SectionRenderer({ sections }: SectionRendererProps) {
  const enabledSections = sections
    .filter(section => section.enabled)
    .sort((a, b) => a.order - b.order)

  return (
    <div className="space-y-0">
      {enabledSections.map((section) => (
        <SectionComponent key={section.id} section={section} />
      ))}
    </div>
  )
}

function SectionComponent({ section }: { section: CampaignSection }) {
  const { config } = section

  // Dynamic padding classes
  const paddingClass = {
    small: 'py-8 md:py-12',
    medium: 'py-12 md:py-16',
    large: 'py-16 md:py-24'
  }[config.padding || 'medium']

  // Dynamic container classes
  const containerClass = config.maxWidth === 'full' ? 'w-full' : 'container mx-auto px-4'

  // Dynamic background and text colors
  const sectionStyle = {
    backgroundColor: config.backgroundColor || 'transparent',
    color: config.textColor || 'inherit'
  }

  switch (section.type) {
    case 'hero':
      return (
        <section
          className={paddingClass}
          style={sectionStyle}
        >
          <div className={containerClass}>
            <div className="text-center">
              {section.title && (
                <h1 className="text-4xl md:text-6xl font-bold mb-4">
                  {section.title}
                </h1>
              )}
              {section.subtitle && (
                <p className="text-lg md:text-xl text-gray-600 mb-8">
                  {section.subtitle}
                </p>
              )}
              {config.ctaText && config.ctaLink && (
                <a
                  href={config.ctaLink}
                  className="inline-block bg-black text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  {config.ctaText}
                </a>
              )}
            </div>
          </div>
        </section>
      )

    case 'product-grid':
      return (
        <section
          className={paddingClass}
          style={sectionStyle}
        >
          <div className={containerClass}>
            {section.title && (
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
                {section.title}
              </h2>
            )}
            <ProductGridSection
              query={config.productQuery || 'bestsellers'}
              limit={config.productLimit || 8}
              showBadges={config.showBadges !== false}
            />
          </div>
        </section>
      )

    case 'banner':
      return (
        <section
          className={paddingClass}
          style={sectionStyle}
        >
          <div className={containerClass}>
            {config.bannerImage && (
              <a
                href={config.bannerLink || '#'}
                className="block rounded-lg overflow-hidden hover:opacity-95 transition-opacity"
              >
                <img
                  src={config.bannerImage}
                  alt={config.bannerAlt || 'Banner'}
                  className="w-full h-auto"
                />
              </a>
            )}
          </div>
        </section>
      )

    case 'category-grid':
      return (
        <section
          className={paddingClass}
          style={sectionStyle}
        >
          <div className={containerClass}>
            {section.title && (
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
                {section.title}
              </h2>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {config.categories?.map((category) => (
                <a
                  key={category.id}
                  href={category.link}
                  className="group block text-center"
                >
                  <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-gray-100">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                    {category.name}
                  </h3>
                </a>
              ))}
            </div>
          </div>
        </section>
      )



    default:
      return null
  }
}

function ProductGridSection({
  query,
  limit,
}: {
  query: string
  limit: number
  showBadges: boolean
}) {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const supabase = createClient()
        let data: Product[] = []
        
        // Include product_variants and default_variant in query for ProductCard variant support
        const productSelect = `
          *,
          product_images(*),
          product_variants!product_variants_product_id_fkey(*),
          default_variant:product_variants!products_default_variant_id_fkey(*)
        `
        
        switch (query) {
          case 'bestsellers':
            const { data: bestsellers } = await supabase
              .from('products')
              .select(productSelect)
              .eq('is_bestseller', true)
              .eq('in_stock', true)
              .limit(limit)
            data = transformProducts(bestsellers || [])
            break
          case 'new-arrivals':
            const { data: newDrops } = await supabase
              .from('products')
              .select(productSelect)
              .eq('is_new_drop', true)
              .eq('in_stock', true)
              .limit(limit)
            data = transformProducts(newDrops || [])
            break
          case 'trending':
            const { data: trending } = await supabase
              .from('products')
              .select(productSelect)
              .eq('in_stock', true)
              .limit(limit)
            data = transformProducts(trending || [])
            break
          default:
            const { data: defaultProducts } = await supabase
              .from('products')
              .select(productSelect)
              .eq('is_bestseller', true)
              .eq('in_stock', true)
              .limit(limit)
            data = transformProducts(defaultProducts || [])
        }
        setProducts(data)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [query, limit])

  if (isLoading) {
    return <div className="text-center py-8 text-gray-400">Loading products...</div>
  }

  return <ProductGrid products={products} />
}
