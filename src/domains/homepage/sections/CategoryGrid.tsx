"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Category } from "@/domains/product/types"
import { supabase } from '@/lib/supabase/supabase'
import { CacheService } from '@/lib/services/redis'

const colorOptions = [
  "bg-amber-50",
  "bg-blue-50",
  "bg-orange-50",
  "bg-gray-50",
  "bg-purple-50",
  "bg-green-50",
  "bg-red-50",
  "bg-indigo-50",
]

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([])
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Try to get from cache first
        const cached = await CacheService.getCachedAllCategories()
        if (cached) {
          setCategories(cached)
          if (cached.length > 0) {
            setHoveredId(cached[0].id)
          }
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
        if (categoryData.length > 0) {
          setHoveredId(categoryData[0].id)
        }

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

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  if (isLoading) {
    return (
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading categories...</div>
          </div>
        </div>
      </section>
    )
  }

  if (categories.length === 0) {
    return null
  }

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="font-heading text-4xl tracking-wider text-black md:text-5xl lg:text-6xl">
              CRAFTED FOR THE
              <br />
              <span className="text-gray-800">MODERN MAN</span>
            </h2>
          </div>
          <div className="hidden flex-col items-end gap-4 lg:flex">
            <p className="max-w-xs text-right font-body text-xs uppercase tracking-wide text-gray-500">
              Essential silhouettes, natural textures, and
              <br />
              effortless layering for every season.
            </p>
            {/* Navigation Arrows */}
            <div className="flex gap-2">
              <button
                onClick={() => scroll('left')}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Horizontal Scroll */}
        <div className="relative mt-12">
          {/* Right Gradient Fade */}
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent" />

          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category, index) => {
              const categoryColor = colorOptions[index % colorOptions.length]
              const categoryImage = category.homepage_thumbnail_url || category.plp_square_thumbnail_url || category.image_url || '/images/placeholder-category.jpg'
              console.log('Category Image Debug:', { name: category.name, url: categoryImage, original: category.homepage_thumbnail_url })
              const categoryHref = `/categories/${category.slug}`

              return (
                <motion.div
                  key={category.id}
                  className="relative flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onHoverStart={() => setHoveredId(category.id)}
                  onHoverEnd={() => setHoveredId(null)}
                >
                  <Link href={categoryHref}>
                    {/* Card */}
                    <motion.div
                      className={`group relative flex h-[500px] cursor-pointer flex-col justify-end overflow-hidden rounded-3xl ${categoryColor} shadow-lg`}
                      animate={{
                        width: hoveredId === category.id ? "400px" : "280px",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      {/* Background Image */}
                      <div className="absolute inset-0">
                        <Image
                          src={categoryImage}
                          alt={category.name}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Reduced Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                      </div>

                      {/* Description Text on Card - Only on Hover */}
                      <AnimatePresence>
                        {hoveredId === category.id && category.description && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.3 }}
                            className="relative z-10 p-6"
                          >
                            <p className="font-body text-xs uppercase tracking-wide text-white/90">
                              {category.description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Bottom Section - Outside Card */}
                    <div className="mt-4 flex items-center gap-3">
                      {/* Red Button - Circle with diagonal arrow (default) / "VIEW ALL" (hover) */}
                      <motion.div
                        className="flex h-12 items-center justify-between overflow-hidden rounded-full bg-red-600"
                        animate={{
                          width: hoveredId === category.id ? "190px" : "48px",
                          paddingLeft: hoveredId === category.id ? "24px" : "0px",
                          paddingRight: hoveredId === category.id ? "8px" : "0px",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        {/* Diagonal Arrow Circle - Default State */}
                        <AnimatePresence mode="wait">
                          {hoveredId !== category.id ? (
                            <motion.div
                              key="arrow-only"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex h-12 w-12 items-center justify-center"
                              style={{ rotate: "320deg" }}
                            >
                              <svg
                                className="h-5 w-5 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                                />
                              </svg>
                            </motion.div>
                          ) : (
                            <motion.div
                              key="view-all"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="flex w-full items-center justify-between"
                            >
                              <span className="font-heading text-sm tracking-wider text-white">
                                VIEW ALL
                              </span>
                              {/* White Circle with Horizontal Arrow */}
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white">
                                <svg
                                  className="h-4 w-4 text-red-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                  />
                                </svg>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>

                      {/* Category Name Button - Always Visible */}
                      <motion.div
                        className="flex h-12 items-center justify-center rounded-full bg-gray-100 px-6"
                        animate={{
                          width: hoveredId === category.id ? "190px" : "220px",
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      >
                        <span className="font-heading text-sm tracking-wider text-gray-800">
                          {category.name.toUpperCase()}
                        </span>
                      </motion.div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}
