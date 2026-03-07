'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import ProductCard from '@/domains/product/components/cards/ProductCard'

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/autoplay'

export default function RelatedProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products/featured?limit=8') // Increased to 8 for carousel
        const data = await res.json()

        if (data.success && data.products) {
          setProducts(data.products)
        }
      } catch (error) {
        console.error('Failed to fetch related products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  if (isLoading) {
    return (
      <section className="mt-12">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-6">
          Complete Your Look
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-6">
        Complete Your Look
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
          {products.map((product, index) => (
            <SwiperSlide key={product.id} className="h-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <ProductCard product={product} />
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  )
}
