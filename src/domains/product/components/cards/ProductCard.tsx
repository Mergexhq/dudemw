"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, ShoppingCart } from "lucide-react"
import { useCart, type CartItem } from "@/domains/cart"
import { useWishlist } from "@/domains/wishlist"
import { toast } from 'sonner'
import { Product } from "@/domains/product"
import { getProductImage } from "@/domains/product/utils/getProductImage"
import StarRating from "@/domains/product/components/ui/StarRating"

interface ProductCardProps {
  product: Product
  badge?: "NEW" | "BESTSELLER" | "SALE" | string
  badgeColor?: "red" | "black" | "gold" | "green" | "blue"
  selectedColor?: string  // Pass from filter to show matching variant
  selectedSize?: string   // Pass from filter to show matching variant
}

export default function ProductCard({ product, badge, badgeColor = "red", selectedColor, selectedSize }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isCartHovered, setIsCartHovered] = useState(false)
  // Cart sound removed - only plays on final purchase
  const { isWishlisted: isInWishlist, toggleWishlist } = useWishlist()
  const { cartItems, addToCart, getItemByVariant } = useCart()

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

  // Generate variant key based on actual variant ID from product_variants array
  const variantKey = displayVariant?.id || product.id

  // Check if product is in cart
  const isInCart = getItemByVariant(variantKey) !== undefined

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

  // Short description - include variant name if present
  const variantLabel = displayVariant?.name ? ` • ${displayVariant.name}` : ""
  const shortDesc = product.description?.slice(0, 40) + variantLabel || "Premium quality • Multiple sizes available"

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

  const imageUrl = getVariantImageUrl()

  // Extract size and color from variant name (e.g., "M / Black" or "Large-Red")
  const extractVariantAttributes = (variantName: string | undefined) => {
    if (!variantName) return { size: undefined, color: undefined }

    // Try to parse common formats: "M / Black", "M-Black", "Medium / Dark Grey", etc.
    const parts = variantName.split(/[\s/\-]+/).map(p => p.trim()).filter(Boolean)

    if (parts.length >= 2) {
      return {
        size: parts[0], // First part is usually size
        color: parts.slice(1).join(' ') // Rest is color
      }
    } else if (parts.length === 1) {
      // Single value - could be size or color, default to size
      return { size: parts[0], color: undefined }
    }

    return { size: undefined, color: undefined }
  }

  const { size: variantSize, color: variantColor } = extractVariantAttributes(displayVariant?.name ?? undefined)

  // Handle add to cart - use variant data
  const handleAddToCart = () => {
    addToCart({
      id: variantKey, // Use variant ID as cart item ID
      title: displayVariant?.name ? `${product.title} - ${displayVariant.name}` : product.title,
      price: currentPrice,
      image: imageUrl,
      size: variantSize,
      color: variantColor,
      variantKey: variantKey,
    })
  }

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
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-50 transition-shadow duration-300 group-hover:shadow-xl">
          {!imageError ? (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gray-200 text-gray-400">
              No Image
            </div>
          )}

          {/* Badge - Top Left */}
          {badge && (
            <span className={`absolute left-2 top-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white md:left-3 md:top-3 md:px-2.5 md:py-1 md:text-xs ${badgeColor === "red" ? "bg-red-600" :
              badgeColor === "gold" ? "bg-yellow-500" :
                badgeColor === "green" ? "bg-green-600" :
                  badgeColor === "blue" ? "bg-blue-600" :
                    "bg-black"
              }`}>
              {badge}
            </span>
          )}

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

          {/* Description - Truncate to 1 line */}
          <p className="mt-1 truncate text-xs text-gray-600">
            {shortDesc}
          </p>

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

          {/* Price with Cart Button */}
          <div className="mt-2 flex items-center justify-between gap-1">
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
            <button
              onClick={(e) => {
                e.preventDefault()
                if (isInCart) {
                  // Navigate to cart
                  window.location.href = '/cart'
                } else {
                  handleAddToCart()
                }
              }}
              onMouseEnter={() => setIsCartHovered(true)}
              onMouseLeave={() => setIsCartHovered(false)}
              className={`flex h-8 flex-shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full transition-all ${isInCart
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-200 hover:bg-red-600"
                } ${isCartHovered ? "w-auto px-3 md:w-auto md:px-3" : "w-8"}`}
              aria-label={isInCart ? "View in cart" : "Add to cart"}
            >
              <ShoppingCart className={`h-4 w-4 flex-shrink-0 transition-colors ${isInCart ? "text-white" : isCartHovered ? "text-white" : "text-red-600"
                }`} />
              {isCartHovered && (
                <span className={`hidden whitespace-nowrap text-xs font-medium transition-colors md:inline ${isInCart ? "text-white" : "text-white"
                  }`}>
                  {isInCart ? "View in Cart" : "Add to Cart"}
                </span>
              )}
            </button>
          </div>
        </div>
      </Link>
    </div>
  )
}
