"use client"

import Link from "next/link"
import { ProductCard } from "@/domains/product"
import { Product } from "@/domains/product"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination } from "swiper/modules"

// Import Swiper styles
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"

interface HorizontalProductScrollProps {
  id?: string
  title: string
  description?: string | null
  products: Product[]
  badge?: "NEW" | "BESTSELLER" | "SALE"
  badgeColor?: "red" | "black"
  viewAllLink?: string
  centerHeader?: boolean
}

export default function HorizontalProductScroll({
  id,
  title,
  description,
  products,
  badge,
  badgeColor = "red",
  viewAllLink,
  centerHeader = false,
}: HorizontalProductScrollProps) {
  return (
    <section id={id} className="mb-8 md:mb-12 scroll-mt-24">
      {centerHeader ? (
        <div className="mb-8 text-center">
          <h2 className="font-heading text-4xl tracking-wider text-black md:text-5xl uppercase">
            {title}
          </h2>
          {description && (
            <p className="mt-2 font-body text-red-600">
              {description}
            </p>
          )}
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold tracking-wide text-black md:text-3xl">
            {title}
          </h2>
          {viewAllLink && (
            <Link
              href={viewAllLink}
              className="text-sm font-medium text-red-600 transition-colors hover:text-red-700 hover:underline"
            >
              View All →
            </Link>
          )}
        </div>
      )}

      {/* Carousel Container */}
      <div className="product-swiper-container relative">
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={16}
          slidesPerView={2}
          navigation
          pagination={{ clickable: true, dynamicBullets: true }}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 20,
            },
            768: {
              slidesPerView: 3,
              spaceBetween: 24,
            },
            1024: {
              slidesPerView: 4,
              spaceBetween: 24,
            },
            1280: {
              slidesPerView: 5,
              spaceBetween: 24,
            },
          }}
          className="product-swiper !pb-12"
        >
          {products.map((product) => (
            <SwiperSlide key={product.id}>
              <ProductCard
                product={product}
                badge={badge}
                badgeColor={badgeColor}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style jsx global>{`
        .product-swiper .swiper-button-next,
        .product-swiper .swiper-button-prev {
          color: #000;
          background: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .product-swiper .swiper-button-next:after,
        .product-swiper .swiper-button-prev:after {
          font-size: 16px;
          font-weight: bold;
        }

        .product-swiper .swiper-pagination-bullet {
          background: #ccc;
          opacity: 1;
        }

        .product-swiper .swiper-pagination-bullet-active {
          background: #ef4444;
        }
        
        .product-swiper {
          padding-left: 4px;
          padding-right: 4px;
        }
      `}</style>
    </section>
  )
}
