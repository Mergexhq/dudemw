'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { ProductCard } from '@/domains/product'
import { createClient } from '@/lib/supabase/client'
import { transformProducts } from '@/domains/product/utils/productUtils'

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'

interface RelatedProductsProps {
  productId: string
  categoryId?: string
  products?: any[]
}

export default function RelatedProducts({ productId, categoryId, products: initialProducts }: RelatedProductsProps) {
  // State only for client-side fetched products
  const [fetchedProducts, setFetchedProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(!initialProducts || initialProducts.length === 0)

  // Derive final products to display: prefer props, fallback to fetched
  const products = (initialProducts && initialProducts.length > 0) ? initialProducts : fetchedProducts

  useEffect(() => {
    // If we have initial products, we don't need to fetch
    if (initialProducts && initialProducts.length > 0) {
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
            ),
            product_variants!product_variants_product_id_fkey(*),
            default_variant:product_variants!products_default_variant_id_fkey(*)
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
          setFetchedProducts(transformedProducts)
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

        <div className="relative">
          <Swiper
            modules={[Autoplay]}
            spaceBetween={16}
            slidesPerView={2}
            loop={products.length > 4} // Only loop if enough items
            speed={1000} // Smooth transition speed
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true
            }}
            breakpoints={{
              640: {
                slidesPerView: 2, // Explicitly 2 for mobile/small tablet
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 24,
              },
              1024: {
                slidesPerView: 4, // Explicitly 4 for desktop
                spaceBetween: 24,
              },
            }}
            className="w-full pb-8"
          >
            {products.map((product) => (
              <SwiperSlide key={product.id} className="h-auto">
                <ProductCard product={product} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  )
}

