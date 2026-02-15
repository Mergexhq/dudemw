"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Category } from "@/domains/product/types"
import { supabase } from '@/lib/supabase/supabase'
import { CacheService } from '@/lib/services/redis'

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Try to get from cache first
        const cached = await CacheService.getCachedAllCategories()
        if (cached) {
          setCategories(cached)
          setIsLoading(false)
          return
        }

        // Fetch from database
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('status', 'active')
          .order('display_order', { ascending: true })
          .order('name', { ascending: true })

        const categoryData = data || []
        setCategories(categoryData)

        // Cache the result for 1 hour
        if (categoryData.length > 0) {
          await CacheService.cacheAllCategories(categoryData)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchCategories()
  }, [])

  if (isLoading) {
    return (
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto max-w-[1600px] px-6">
          <div className="mb-8">
            <div className="h-8 w-64 animate-pulse bg-gray-200 rounded" />
          </div>
          <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-[3/4] w-full animate-pulse bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-[1600px] px-6">
        {/* Section Header */}
        <div className="mb-8 flex items-center justify-center">
          <h2 className="font-heading text-2xl text-black md:text-3xl lg:text-4xl text-center">
            Featured Categories
          </h2>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((category) => {
            const categoryImage = category.homepage_thumbnail_url || category.plp_square_thumbnail_url || category.image_url || '/images/placeholder-category.jpg'
            const categoryHref = `/categories/${category.slug}`

            return (
              <Link key={category.id} href={categoryHref} className="group block relative aspect-[3/4] overflow-hidden rounded-lg">
                {/* Background Image */}
                <Image
                  src={categoryImage}
                  alt={category.name}
                  fill
                  unoptimized
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Dark Overlay - Bottom Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />

                {/* Bottom Aligned Text */}
                <div className="absolute inset-0 flex items-end justify-center p-6 text-center">
                  <h3 className="font-heading text-lg font-bold tracking-widest text-white md:text-xl uppercase drop-shadow-md">
                    {category.name}
                  </h3>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
