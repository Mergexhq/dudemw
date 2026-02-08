"use client"

import Image from "next/image"
import Link from "next/link"
import { Swiper, SwiperSlide } from "swiper/react"
import { Autoplay, Pagination } from "swiper/modules"
import type { Banner } from "@/types/banner"

// Import Swiper styles
import "swiper/css"
import "swiper/css/pagination"

interface HeroClientProps {
  banners: Banner[]
}

export default function HeroClient({ banners }: HeroClientProps) {
  return (
    <section className="w-full bg-gray-50 px-4 pt-2 pb-4 md:px-8 md:pt-3 md:pb-6">
      {/* Hero Container - Rounded with Shadow */}
      <div className="relative mx-auto max-w-[1600px] overflow-hidden rounded-2xl shadow-2xl md:rounded-3xl">
        <Swiper
          modules={[Autoplay, Pagination]}
          spaceBetween={0}
          slidesPerView={1}
          speed={800}
          autoplay={{
            delay: 6000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
            bulletClass: "swiper-pagination-bullet",
            bulletActiveClass: "swiper-pagination-bullet-active",
          }}
          loop={banners.length > 1}
          className="hero-swiper"
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner.id}>
              <Link href={banner.link_url || '#'} className="block">
                <div className="relative min-h-[700px] md:min-h-[900px]">
                  <Image
                    src={banner.image_url || ''}
                    alt={banner.internal_title}
                    fill
                    priority
                    unoptimized
                    className="object-cover object-center"
                  />

                  {/* Overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
              </Link>

              {/* Text Content - Bottom Left */}
              <div className="absolute bottom-0 left-0 z-10 px-8 pb-20 md:px-12 md:pb-24 lg:px-16">
                {/* Main Title */}
                <h1 className="font-heading text-6xl leading-[0.9] tracking-tighter text-white md:text-7xl lg:text-8xl">
                  {banner.internal_title}
                </h1>

                {/* CTA Button */}
                <div className="mt-6">
                  <Link
                    href={banner.link_url || '#'}
                    className="inline-block rounded-lg px-6 py-3 font-heading text-base tracking-wider transition-all duration-300 md:px-8 md:py-3.5 md:text-lg bg-red-600 text-white hover:bg-black hover:shadow-xl"
                  >
                    EXPLORE STYLES
                  </Link>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx global>{`
        .hero-swiper .swiper-pagination {
          bottom: 2rem !important;
        }
        .hero-swiper .swiper-pagination-bullet {
          width: 12px;
          height: 12px;
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          transition: all 0.3s ease;
        }
        .hero-swiper .swiper-pagination-bullet:hover {
          background: rgba(255, 255, 255, 0.8);
        }
        .hero-swiper .swiper-pagination-bullet-active {
          width: 32px;
          background: #ff0000;
          border-radius: 6px;
        }
      `}</style>
    </section>
  )
}
