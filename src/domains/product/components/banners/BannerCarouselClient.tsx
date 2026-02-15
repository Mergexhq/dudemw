"use client"

import Image from "next/image"
import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, EffectCreative } from "swiper/modules"
import type { Banner } from "@/types/banner"


// Import Swiper styles
import "swiper/css"
import "swiper/css/effect-creative"

interface BannerCarouselClientProps {
  banners: Banner[]
}

interface CarouselSlide {
  image_url?: string
  imageUrl?: string
  title_text?: string
  action_type?: string
  action_target?: string
  action_name?: string
  cta_text?: string
}

// Helper to generate link from action type and target
function generateLink(actionType?: string, actionTarget?: string): string {
  if (!actionType || !actionTarget) return "/products"

  switch (actionType) {
    case 'collection':
      return `/products#${actionTarget}`
    case 'category':
      return `/categories/${actionTarget}`
    case 'product':
      return `/products/${actionTarget}`
    case 'external':
      return actionTarget
    default:
      return "/products"
  }
}

export default function BannerCarouselClient({ banners }: BannerCarouselClientProps) {
  // Parse carousel_data from all banners to get individual slides
  const slides: { id: string; image_url: string; title: string; link: string; cta_text: string }[] = []

  banners.forEach((banner) => {
    // Try to parse carousel_data with robust handling for double-encoded JSON
    let carouselItems: CarouselSlide[] = []
    if (banner.carousel_data) {
      try {
        let parsed: unknown = banner.carousel_data

        // Handle double-encoded JSON strings
        if (typeof parsed === 'string') {
          // First parse
          parsed = JSON.parse(parsed)

          // If still a string after first parse, parse again (double-encoded)
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed)
          }
        }

        // Type assertion after parsing
        carouselItems = parsed as CarouselSlide[]
      } catch (e) {
        console.error('Failed to parse carousel_data for banner:', banner.id, e)
        carouselItems = []
      }
    }

    // Ensure it's an array
    if (!Array.isArray(carouselItems)) {
      // If it's an object (single slide) wrap it
      if (carouselItems && typeof carouselItems === 'object') {
        carouselItems = [carouselItems]
      } else {
        carouselItems = []
      }
    }

    if (Array.isArray(carouselItems) && carouselItems.length > 0) {
      // This is a carousel banner - add each slide
      carouselItems.forEach((item, index) => {
        const imageUrl = item.image_url || item.imageUrl
        if (imageUrl) {
          slides.push({
            id: `${banner.id}-${index}`,
            image_url: imageUrl,
            title: item.title_text || banner.internal_title || 'Banner',
            link: generateLink(item.action_type, item.action_target),
            cta_text: item.cta_text || 'SHOP NOW'
          })
        }
      })
    } else if (banner.image_url) {
      // This is a single image banner
      slides.push({
        id: banner.id,
        image_url: banner.image_url,
        title: banner.internal_title || 'Banner',
        link: banner.link_url || generateLink(banner.action_type || undefined, banner.action_target || undefined),
        cta_text: 'SHOP NOW'
      })
    }
  })

  if (slides.length === 0) {
    return null
  }

  return (
    <section className="relative w-full bg-white pb-0">
      <div className="w-full">
        {/* Main Relative Container */}
        <div className="relative w-full">

          {/* Slider Container - Handles clipping and shadow */}
          <div
            className="relative w-full overflow-hidden h-auto md:aspect-auto"
          >
            <Swiper
              modules={[Autoplay, EffectCreative]}
              spaceBetween={0}
              slidesPerView={1}
              speed={800}
              effect="creative"
              creativeEffect={{
                prev: {
                  translate: ["-100%", 0, 0],
                },
                next: {
                  translate: ["100%", 0, 0],
                },
              }}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              loop={slides.length > 1}
              className="banner-swiper h-full w-full"
            >
              {slides.map((slide) => (
                <SwiperSlide key={slide.id} className="h-full w-full">
                  <Link href={slide.link} className="block h-full w-full">
                    {/* Full height of parent SwiperSlide */}
                    <div className="relative h-full w-full">
                      <Image
                        src={slide.image_url}
                        alt={slide.title}
                        width={1920}
                        height={1080}
                        unoptimized
                        className="h-full w-full object-cover md:object-cover"
                        style={{
                          width: '100%',
                          height: 'auto',
                        }}
                        onError={(e) => {
                          console.warn('Banner image failed to load:', slide.image_url);
                          e.currentTarget.src = '/images/categories/T-Shirt.png';
                        }}
                      />

                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>

      <style jsx global>{`
      `}</style>
    </section>
  )
}

