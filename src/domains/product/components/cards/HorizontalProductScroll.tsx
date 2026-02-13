"use client"

import Link from "next/link"
import { ProductCard } from "@/domains/product"
import { Product } from "@/domains/product"

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

      {/* Grid Container */}
      <div className="relative -mx-4 px-4 md:mx-0 md:px-0">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {products.map((product) => (
            <div
              key={product.id}
            >
              <ProductCard
                product={product}
                badge={badge}
                badgeColor={badgeColor}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
