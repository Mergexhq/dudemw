"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingBag, ShoppingCart } from "lucide-react"
import { useWishlist } from "@/domains/wishlist"
import { toast } from 'sonner'
import { Product } from "@/domains/product"
import { getProductImage } from "@/domains/product/utils/getProductImage"
import StarRating from "@/domains/product/components/ui/StarRating"
import QuickAddDialog from "./QuickAddDialog"

interface ProductCardProps {
  product: Product
  badge?: "NEW" | "BESTSELLER" | "SALE" | string
  badgeColor?: "red" | "black" | "gold" | "green" | "blue"
  selectedColor?: string  // Pass from filter to show matching variant
  selectedSize?: string   // Pass from filter to show matching variant
}

export default function ProductCard({ product, badge, badgeColor = "red", selectedColor, selectedSize }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { isWishlisted: isInWishlist, toggleWishlist } = useWishlist()

  // Find variant matching the selected filter (combines color and size for best match)
  const findMatchingVariant = () => {
    const variants = product.product_variants || []
    if (variants.length === 0) {
      return product.default_variant || null
    }

    // Helper to check if variant name contains a value (case-insensitive)
    const variantContains = (variantName: string | null | undefined, value: string): boolean => {
      if (!variantName || !value) return false
      return variantName.toLowerCase().includes(value.toLowerCase())
    }

    // If both color and size are selected, find the best match
    if (selectedColor && selectedSize) {
      // First try to find variant matching both
      const exactMatch = variants.find(v =>
        variantContains(v.name, selectedColor) && variantContains(v.name, selectedSize)
      )
      if (exactMatch) return exactMatch
    }

    // Try color match
    if (selectedColor) {
      const colorMatch = variants.find(v => variantContains(v.name, selectedColor))
      if (colorMatch) return colorMatch
    }

    // Try size match
    if (selectedSize) {
      const sizeMatch = variants.find(v => variantContains(v.name, selectedSize))
      if (sizeMatch) return sizeMatch
    }

    // Fallback to default variant or first variant
    return product.default_variant || variants[0] || null
  }

  // Get the appropriate variant based on filters
  const displayVariant = findMatchingVariant()

  // Check if product is in wishlist - product level only
  const isWishlisted = isInWishlist(product.id)

  // Price calculations - use variant price for selling price, product compare_price for MRP
  const currentPrice = displayVariant?.price || product.price
  // MRP: Check variant first (discount_price), then product level (compare_price)
  // Note: In DB, variant's compare_at_price is stored in discount_price column
  const originalPrice = displayVariant?.discount_price || product.compare_price || null

  // Calculate discount only if MRP exists and is higher than selling price
  const discountPercent = originalPrice && originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0
  const displayPrice = currentPrice
  const displayOriginalPrice = discountPercent > 0 ? originalPrice : null

  // Determine badge to show (Prioritize Discount over NEW)
  let displayBadge = badge
  let displayBadgeColor = badgeColor

  if (discountPercent > 0 && (badge === "NEW" || !badge)) {
    displayBadge = `${discountPercent}% OFF`
    displayBadgeColor = "red"
  }



  // Use variant images (from variant_images table) or fallback to variant image_url or product images
  const getVariantImageUrl = () => {
    // First priority: variant_images array from the default variant
    if (displayVariant?.variant_images && displayVariant.variant_images.length > 0) {
      return displayVariant.variant_images[0].image_url
    }
    // Second priority: variant's image_url field
    if (displayVariant?.image_url) {
      return displayVariant.image_url
    }
    // Fallback to product images
    return getProductImage(null, product.images)
  }

  const getHoverImageUrl = () => {
    // Priority 1: Second image from variant images
    if (displayVariant?.variant_images && displayVariant.variant_images.length > 1) {
      return displayVariant.variant_images[1].image_url
    }

    // Priority 2: Second image from product images
    // product.images is string[], not an array of objects
    if (product.images && product.images.length > 1) {
      // Simply return the second image URL
      return product.images[1]
    }

    return null
  }

  const imageUrl = getVariantImageUrl()
  const hoverImageUrl = getHoverImageUrl()

  return (
    <div className="group relative">
      <Link
        href={product?.slug ? `/products/${product.slug}` : '#'}
        onClick={(e) => {
          if (!product?.slug) {
            e.preventDefault()
            console.error('[ProductCard] Product missing slug:', product?.id, product?.title)
            toast.error('Product information is incomplete. Please try again later.')
          }
        }}
        className="block transition-transform duration-300 ease-out active:scale-95"
      >
        {/* Image Container - Portrait aspect ratio */}
        <div className="relative aspect-[3/4] overflow-hidden bg-gray-50 transition-shadow duration-300 group-hover:shadow-xl">
          {!imageError ? (
            <>
              {/* Main Image */}
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className={`object-cover transition-all duration-300 ${hoverImageUrl ? 'group-hover:opacity-0' : 'group-hover:scale-105'}`}
                sizes="(max-width: 768px) 50vw, 25vw"
                onError={() => setImageError(true)}
              />

              {/* Hover Image */}
              {hoverImageUrl && (
                <Image
                  src={hoverImageUrl}
                  alt={product.title}
                  fill
                  className="absolute inset-0 object-cover transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              )}
            </>
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-200 text-gray-400">
              No Image
            </div>
          )}

          {/* Badges - Top Left (Stacked) */}
          <div className="absolute left-2 top-2 flex flex-col gap-1 md:left-3 md:top-3">
            {displayBadge && (
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white md:px-2.5 md:py-1 md:text-xs ${displayBadgeColor === "red" ? "bg-red-600" :
                displayBadgeColor === "gold" ? "bg-yellow-500" :
                  displayBadgeColor === "green" ? "bg-green-600" :
                    displayBadgeColor === "blue" ? "bg-blue-600" :
                      "bg-black"
                }`}>
                {displayBadge}
              </span>
            )}

            {/* Scarcity Indicators */}
            {(() => {
              // Calculate total stock from variants
              const totalStock = product.product_variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0

              if (totalStock === 1) {
                return (
                  <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white md:px-2.5 md:py-1 md:text-xs">
                    Last One!
                  </span>
                )
              } else if (totalStock > 1 && totalStock < 5) {
                return (
                  <span className="rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white md:px-2.5 md:py-1 md:text-xs">
                    Only {totalStock} Left
                  </span>
                )
              }
              return null
            })()}
          </div>

          {/* Favorite Icon - Top Right */}
          <button
            onClick={(e) => {
              e.preventDefault()
              toggleWishlist(product.id)
            }}
            className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur transition-all ${isWishlisted
              ? "bg-red-600 text-white"
              : "bg-white/90 text-gray-700 hover:bg-red-600 hover:text-white"
              }`}
            aria-label="Add to wishlist"
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Content - Separated from image */}
        <div className="mt-3">
          {/* Product Title - 18px bold - Truncate to 1 line */}
          <h3 className="truncate font-body !text-[18px] !font-bold !leading-tight !text-black transition-colors duration-200 group-hover:!text-red-600">
            {product.title}
          </h3>

          {product.subtitle && (
            <p className="mt-0.5 truncate text-[11px] text-gray-500 font-medium">
              {product.subtitle}
            </p>
          )}

          {/* Description - Truncate to 1 line */}


          {/* Star Rating - Only show if reviews exist */}
          {product.review_count != null && product.review_count > 0 && product.average_rating != null && product.average_rating > 0 && (
            <div className="mt-1.5">
              <StarRating
                rating={product.average_rating}
                reviewCount={product.review_count}
                size="sm"
                showCount={true}
              />
            </div>
          )}

          {/* Price and Add to Cart */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-1 md:gap-2">
                <span className="text-base font-bold text-black md:text-lg">
                  ₹{displayPrice.toLocaleString()}
                </span>
                {displayOriginalPrice && discountPercent > 0 && (
                  <>
                    <span className="text-xs text-gray-500 line-through md:text-sm">
                      ₹{displayOriginalPrice.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-semibold text-red-600 md:text-xs">
                      ({discountPercent}% OFF)
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-gray-500 mt-0.5">(Inclusive of All Taxes)</p>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={(e) => {
                e.preventDefault()
                setIsDialogOpen(true)
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white hover:bg-gray-900 transition-all hover:scale-110 active:scale-95 group/cart"
              aria-label="Add to cart"
            >
              <ShoppingCart className="h-4 w-4 transition-transform duration-300 group-hover/cart:-translate-y-0.5 group-hover/cart:translate-x-0.5" />
            </button>
          </div>
        </div>
      </Link>

      {/* Quick Add Dialog */}
      <QuickAddDialog
        product={product}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}

