"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart, Image as ImageIcon } from "lucide-react"

interface ProductImage {
  id: string
  url: string
  alt: string
  isPrimary: boolean
}

interface ProductPreviewProps {
  productName: string
  productSubtitle: string
  price: string
  comparePrice: string
  images: ProductImage[]
  status: string
  hasVariants: boolean
  variantCount: number
}

export function ProductPreview({
  productName,
  productSubtitle,
  price,
  comparePrice,
  images,
  status,
  hasVariants,
  variantCount
}: ProductPreviewProps) {
  const primaryImage = images.find(img => img.isPrimary)
  const displayPrice = parseFloat(price) || 0
  const displayComparePrice = parseFloat(comparePrice) || 0
  const discount = displayComparePrice > displayPrice
    ? Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)
    : 0

  // Short description for preview
  const shortDesc = productSubtitle?.slice(0, 50) || "Premium quality • Multiple sizes available"

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-2 h-2 bg-red-600 rounded-full"></span>
          Store Preview
        </CardTitle>
        <p className="text-xs text-gray-500">How customers will see this product</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mock Product Card - Matches store's ProductCard style */}
        <div className="group relative">
          {/* Image Container - Portrait aspect ratio matching store */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800 transition-shadow duration-300 group-hover:shadow-xl">
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No image</p>
                </div>
              </div>
            )}

            {/* Badge - Top Left (like store) */}
            {status === 'active' && (
              <span className="absolute left-2 top-2 rounded-full bg-red-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                NEW
              </span>
            )}

            {/* Discount Badge */}
            {discount > 0 && (
              <span className="absolute left-2 top-10 rounded-full bg-green-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                {discount}% OFF
              </span>
            )}

            {/* Favorite Icon - Top Right (like store) */}
            <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-gray-700 backdrop-blur transition-all hover:bg-red-600 hover:text-white">
              <Heart className="h-4 w-4" />
            </div>
          </div>

          {/* Content - Separated from image (like store) */}
          <div className="mt-3">
            {/* Product Title - Bold, truncate to 1 line */}
            <h3 className="truncate font-bold text-lg leading-tight text-gray-900 dark:text-white group-hover:text-red-600 transition-colors">
              {productName || "Product Name"}
            </h3>

            {/* Description - Truncate to 1 line */}
            <p className="mt-1 truncate text-xs text-gray-600 dark:text-gray-400">
              {shortDesc}
            </p>

            {/* Star Rating (like store) */}
            <div className="mt-1.5 flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className="h-3 w-3 fill-yellow-400 text-yellow-400"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
              <span className="ml-1 text-xs text-gray-500">(4.5)</span>
            </div>

            {/* Price with Cart Button (like store) */}
            <div className="mt-2 flex items-center justify-between gap-1">
              <div className="flex flex-wrap items-center gap-1">
                {displayPrice > 0 ? (
                  <>
                    <span className="text-base font-bold text-gray-900 dark:text-white">
                      ₹{displayPrice.toLocaleString()}
                    </span>
                    {displayComparePrice > displayPrice && (
                      <>
                        <span className="text-xs text-gray-500 line-through">
                          ₹{displayComparePrice.toLocaleString()}
                        </span>
                        <span className="text-[10px] font-semibold text-red-600">
                          ({discount}% OFF)
                        </span>
                      </>
                    )}
                  </>
                ) : hasVariants ? (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Price varies
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">
                    Price not set
                  </span>
                )}
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 hover:bg-red-600 transition-colors cursor-pointer">
                <ShoppingCart className="h-4 w-4 text-red-600 hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </div>

        {/* Variant Info */}
        {hasVariants && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {variantCount} variant{variantCount !== 1 ? 's' : ''} available
            </p>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500">Publish Status:</span>
          <Badge
            className={
              status === "active"
                ? "bg-green-100 text-green-700 border-green-200"
                : status === "draft"
                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                  : "bg-gray-100 text-gray-700 border-gray-200"
            }
          >
            {status || 'draft'}
          </Badge>
        </div>

        {/* Preview Note */}
        <p className="text-[10px] text-gray-400 text-center">
          Preview only — not functional
        </p>
      </CardContent>
    </Card>
  )
}