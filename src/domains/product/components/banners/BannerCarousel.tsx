"use client"

import { useEffect, useState } from "react"
import { createClient } from '@/lib/supabase/client'
import { CacheService } from '@/lib/services/redis'
import type { Banner } from "@/types/banner"
import BannerCarouselClient from "./BannerCarouselClient"

interface BannerCarouselProps {
  // Defaults to homepage-carousel, use product-listing-carousel for PLP
  placement?: 'homepage-carousel' | 'product-listing-carousel'
}

export default function BannerCarousel({ placement = 'homepage-carousel' }: BannerCarouselProps) {
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchBanners() {
      try {
        // Try to get from cache first
        const cached = await CacheService.getCachedBanners(placement)
        if (cached) {
          setBanners(cached)
          setIsLoading(false)
          return
        }

        // Fetch from database
        const supabase = createClient()
        const { data } = await supabase
          .from('banners')
          .select('*')
          .eq('placement', placement)
          .eq('status', 'active')
          .order('position')

        const bannerData = data || []
        setBanners(bannerData)

        // Cache the result for 5 minutes
        if (bannerData.length > 0) {
          await CacheService.cacheBanners(placement, bannerData)
        }
      } catch (error) {
        console.error("Failed to fetch banners:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBanners()
  }, [placement])

  if (isLoading) {
    return (
      <section className="w-full bg-white">
        <div className="relative w-full overflow-hidden bg-gray-100 aspect-[4/5] md:h-[400px] md:aspect-auto flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </section>
    )
  }

  if (banners.length === 0) {
    return null
  }

  return <BannerCarouselClient banners={banners} />
}

