"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Category } from "@/domains/product"
import { getCategoryBySlugAction } from '@/lib/actions/categories'
import { getCategoryBannerAction } from '@/lib/actions/banners'

interface CategoryTitleBannerProps {
  handle?: string
}

interface CategoryBanner {
  id: string
  image_url: string | null
  internal_title: string
}

export default function CategoryTitleBanner({ handle }: CategoryTitleBannerProps) {
  const [category, setCategory] = useState<Category | null>(null)
  const [banner, setBanner] = useState<CategoryBanner | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!handle) {
        setLoading(false)
        return
      }
      try {
        // Fetch category by slug
        const categoryResult = await getCategoryBySlugAction(handle)
        if (categoryResult.success && categoryResult.data) {
          setCategory(categoryResult.data as any)
        }

        // Fetch category-specific banner
        const bannerResult = await getCategoryBannerAction(handle)
        if (bannerResult.success && bannerResult.data) {
          setBanner(bannerResult.data as any)
        }
      } catch (error) {
        console.error('Failed to fetch category data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [handle])

  if (loading) {
    return (
      <section className="w-full bg-white px-4 pt-2 pb-4 md:px-8 md:pt-3 md:pb-6">
        <div className="relative mx-auto max-w-[1600px] overflow-hidden rounded-none shadow-2xl md:rounded-3xl">
          <div className="relative h-[400px] md:h-[500px] bg-gray-200 flex items-center justify-center">
            <div className="text-gray-400">Loading...</div>
          </div>
        </div>
      </section>
    )
  }

  if (!category) {
    return null
  }

  const title = category.name.toUpperCase()
  // Use banner image if available, fallback to category image
  const bannerImage = banner?.image_url || category.image_url || category.homepage_thumbnail_url || '/images/placeholder-banner.jpg'
  const description = category.description || 'Elevate Your Everyday Style'

  return (
    <section className="w-full bg-white px-4 pt-2 pb-4 md:px-8 md:pt-3 md:pb-6">
      {/* Card Container - Rounded with Shadow */}
      <div className="relative mx-auto max-w-[1600px] overflow-hidden rounded-none shadow-2xl md:rounded-3xl">
        <div className="relative h-[400px] md:h-[500px]">
          {/* Background Image */}
          <Image
            src={bannerImage}
            alt={title}
            fill
            unoptimized
            className="object-cover object-center"
          />
          {/* Dark overlay for better text visibility */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Content - Centered at Bottom */}
          <div className="absolute inset-x-0 bottom-0 pb-12 md:pb-16">
            <div className="container mx-auto px-4 text-center">
              {/* Category Title - Big, Bold, Prominent White */}
              <h1
                className="font-heading font-extrabold tracking-wider mb-4"
                style={{
                  fontSize: 'clamp(4rem, 12vw, 10rem)',
                  color: '#FFFFFF',
                  textShadow: '0 10px 40px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6)',
                  lineHeight: '1'
                }}
              >
                {title}
              </h1>

              {/* Subtitle - White */}
              <p
                className="font-body"
                style={{
                  fontSize: 'clamp(1.125rem, 2.5vw, 2rem)',
                  color: '#FFFFFF',
                  textShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                }}
              >
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
