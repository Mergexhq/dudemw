'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/supabase'

interface SimpleProduct {
  id: string
  title: string
  slug: string
  price: number
  imageUrl: string
}

export default function RelatedProducts() {
  const [products, setProducts] = useState<SimpleProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data } = await supabase
          .from('products')
          .select('id, title, slug, price, product_images(image_url, is_primary)')
          .eq('status', 'published')
          .limit(4)

        const mapped = (data || []).map((product: any) => {
          const primaryImage = product.product_images?.find((img: any) => img.is_primary)
          const firstImage = product.product_images?.[0]
          const imageUrl = primaryImage?.image_url || firstImage?.image_url || '/images/placeholder-product.jpg'

          return {
            id: product.id,
            title: product.title,
            slug: product.slug || '',
            price: product.price || 0,
            imageUrl
          }
        })

        setProducts(mapped)
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
        <div className="text-center py-8 text-gray-400">Loading...</div>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={`/products/${product.slug}`} className="group block">
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-3">
                <Image
                  src={product.imageUrl}
                  fill
                  alt={product.title}
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-medium text-gray-900 mb-1 group-hover:text-red-600 transition-colors line-clamp-2">
                {product.title}
              </h3>
              <p className="font-bold text-gray-900">
                ₹{product.price.toLocaleString('en-IN')}
              </p>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
