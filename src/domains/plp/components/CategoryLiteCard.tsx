"use client"

import Image from "next/image"
import Link from "next/link"
import { Category } from "@/lib/services/categories"

interface CategoryLiteCardProps {
  category: Category
  productCount?: number
}

export function CategoryLiteCard({ category, productCount }: CategoryLiteCardProps) {
  const thumbnailUrl = category.image_url || '/placeholder-category-square.jpg'

  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group block"
    >
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200 hover:border-gray-300">
        {/* Square Thumbnail */}
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={thumbnailUrl}
            alt={category.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Category Info */}
        <div className="p-3">
          <h3 className="font-medium text-gray-900 text-sm group-hover:text-red-600 transition-colors truncate">
            {category.name}
          </h3>
          {productCount !== undefined && (
            <p className="text-xs text-gray-500 mt-1">
              {productCount} {productCount === 1 ? 'product' : 'products'}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}