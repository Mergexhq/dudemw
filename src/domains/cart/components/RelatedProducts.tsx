'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import ProductCard from '@/domains/product/components/cards/ProductCard'

export default function RelatedProducts() {
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products/featured?limit=4')
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
