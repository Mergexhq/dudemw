"use client"

import Image from "next/image"
import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination, EffectCreative } from "swiper/modules"
import type { Banner } from "@/types/banner"

// Import Swiper styles
import "swiper/css"
import "swiper/css/pagination"
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
  if (!actionType || !actionTarget) return "/collections/all"

  switch (actionType) {
    case 'collection':
      return `/collections/${actionTarget}`
    case 'category':
      return `/categories/${actionTarget}`
    case 'product':
      return `/products/${actionTarget}`
    case 'external':
      return actionTarget
    default:
      return "/collections/all"
  }
}

export default function BannerCarouselClient({ banners }: BannerCarouselClientProps) {
  // Parse carousel_data from all banners to get individual slides
  const slides: { id: string; image_url: string; title: string; link: string; cta_text: string }[] = []

  banners.forEach((banner) => {
    // Try to parse carousel_data
    let carouselItems: CarouselSlide[] = []
    if (banner.carousel_data) {
      try {
        carouselItems = typeof banner.carousel_data === 'string'
          ? JSON.parse(banner.carousel_data)
          : banner.carousel_data
      } catch (e) {
        console.error('Failed to parse carousel_data:', e)
      }
    }

    if (carouselItems && carouselItems.length > 0) {
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
    <section className="w-full bg-white px-4 py-4 md:px-8">
      {/* Banner Container - Rounded with Shadow */}
      <div className="relative mx-auto max-w-[1920px] overflow-hidden rounded-2xl shadow-xl md:rounded-3xl">
        <Swiper
          modules={[Autoplay, Pagination, EffectCreative]}
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
          pagination={{
            clickable: true,
            bulletClass: "swiper-pagination-bullet",
            bulletActiveClass: "swiper-pagination-bullet-active",
          }}
          loop={slides.length > 1}
          className="banner-swiper"
        >
          {slides.map((slide) => (
            <SwiperSlide key={slide.id}>
              <Link href={slide.link} className="block">
                {/* 16:9 aspect ratio on mobile, fixed height on desktop */}
                <div className="relative aspect-video md:h-[400px] md:aspect-auto">
                  <Image
                    src={slide.image_url}
                    alt={slide.title}
                    fill
                    unoptimized
                    className="object-cover object-center"
                    onError={(e) => {
                      console.warn('Banner image failed to load:', slide.image_url);
                      e.currentTarget.src = '/images/categories/T-Shirt.png';
                    }}
                  />

                  {/* Overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                </div>
              </Link>

              {/* Text Content - Left Side */}
              <div className="absolute bottom-0 left-0 top-0 z-10 flex flex-col justify-center px-6 md:px-12 lg:px-16">
                {/* Main Title */}
                <h2 className="font-heading text-4xl leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
                  {slide.title}
                </h2>

                {/* CTA Button */}
                <div className="mt-5">
                  <Link
                    href={slide.link}
                    className="inline-block rounded-lg bg-red-600 px-6 py-2.5 font-heading text-sm tracking-wider text-white transition-all duration-300 hover:bg-black hover:shadow-xl md:px-8 md:py-3 md:text-base"
                  >
                    {slide.cta_text}
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx global>{`
        .banner-swiper .swiper-pagination {
          bottom: 1.5rem !important;
        }
        .banner-swiper .swiper-pagination-bullet {
          width: 10px;
          height: 10px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          transition: all 0.3s ease;
        }
        .banner-swiper .swiper-pagination-bullet:hover {
          background: rgba(255, 255, 255, 0.8);
        }
        .banner-swiper .swiper-pagination-bullet-active {
          width: 28px;
          background: #ff0000;
          border-radius: 5px;
        }
      `}</style>
    </section>
  )
}

