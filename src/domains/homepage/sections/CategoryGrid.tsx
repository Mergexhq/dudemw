"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Autoplay } from "swiper/modules"
import { Category } from "@/domains/product/types"
import { supabase } from '@/lib/supabase/supabase'
import { CacheService } from '@/lib/services/redis'
import { ChevronLeft, ChevronRight } from "lucide-react"

// Import Swiper styles
import "swiper/css"
import "swiper/css/navigation"

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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
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
        <div className="mb-8 relative flex items-center justify-center">
          <h2 className="font-heading text-2xl text-black md:text-3xl lg:text-4xl text-center">
            Featured Categories
          </h2>

          {/* Custom Navigation Buttons */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden md:flex gap-2">
            <button className="swiper-button-prev-custom flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:bg-black hover:text-white hover:border-black">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button className="swiper-button-next-custom flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white transition-colors hover:bg-black hover:text-white hover:border-black">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Categories Swiper */}
        <div className="relative">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={4}
            slidesPerView={1.2}
            navigation={{
              prevEl: '.swiper-button-prev-custom',
              nextEl: '.swiper-button-next-custom',
            }}
            breakpoints={{
              640: {
                slidesPerView: 2.2,
              },
              768: {
                slidesPerView: 3.2,
              },
              1024: {
                slidesPerView: 4,
              },
            }}
            className="w-full"
          >
            {categories.map((category) => {
              const categoryImage = category.homepage_thumbnail_url || category.plp_square_thumbnail_url || category.image_url || '/images/placeholder-category.jpg'
              const categoryHref = `/categories/${category.slug}`

              return (
                <SwiperSlide key={category.id}>
                  <Link href={categoryHref} className="group block relative aspect-[3/4] overflow-hidden">
                    {/* Background Image */}
                    <Image
                      src={categoryImage}
                      alt={category.name}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />

                    {/* Centered Text */}
                    <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
                      <h3 className="font-heading text-base font-semibold tracking-widest text-white md:text-xl uppercase">
                        {category.name}
                      </h3>
                    </div>
                  </Link>
                </SwiperSlide>
              )
            })}
          </Swiper>
        </div>
      </div>
    </section>
  )
}
