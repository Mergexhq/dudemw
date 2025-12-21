'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { ProductCard } from '@/domains/product'
import { createClient } from '@/lib/supabase/client'
import { transformProducts } from '@/domains/product/utils/productUtils'

interface RelatedProductsProps {
  productId: string
  categoryId?: string
  products?: any[]
}

export default function RelatedProducts({ productId, categoryId, products: initialProducts }: RelatedProductsProps) {
  const [products, setProducts] = useState<any[]>(initialProducts || [])
  const [isLoading, setIsLoading] = useState(!initialProducts || initialProducts.length === 0)

  useEffect(() => {
    // If we already have products passed as props, use those
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts)
      setIsLoading(false)
      return
    }

    async function fetchRelatedProducts() {
      setIsLoading(true)
      try {
        const supabase = createClient()

        // Build query for related products
        let query = supabase
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
          .eq('status', 'published')
          .neq('id', productId)
          .limit(8)

        // If we have a category, filter by it
        if (categoryId) {
          query = query.eq('category_id', categoryId)
        }

        const { data, error } = await query.order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching related products:', error)
          return
        }

        if (data && data.length > 0) {
          // Transform products to include proper image URLs
          const transformedProducts = transformProducts(data)
          setProducts(transformedProducts)
        }
      } catch (error) {
        console.error('Error fetching related products:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [productId, categoryId, initialProducts])

  // If loading, show loader
  if (isLoading) {
    return (
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-heading tracking-wider mb-8 text-center">
            YOU MAY ALSO LIKE
          </h2>
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </div>
      </section>
    )
  }

  // If no products, don't show section
  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-heading tracking-wider mb-8 text-center">
          YOU MAY ALSO LIKE
        </h2>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}

