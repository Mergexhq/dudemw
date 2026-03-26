'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Heart, Upload, Star, Package, ChevronLeft, ChevronRight, ShoppingBag, Plus, Minus, ShoppingCart, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

import ProductOptions from './ProductOptions'
import AddToCartButton from './AddToCartButton'
import FloatingBottomBar from './FloatingBottomBar'
import ColorVariantSelector from './ColorVariantSelector'
import ProductDescription from './ProductDescription'

import { Product } from '@/domains/product'
import { getProductImage } from '@/domains/product/utils/getProductImage'
import { getColorFromProduct } from '@/domains/product/utils/getColorFromProduct'
import { useCart } from '@/domains/cart'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { SettingsClientService } from '@/lib/services/settings-client'
import { TaxSettings } from '@/domains/admin/settings/tax/types'

interface DesktopProductViewProps {
  product: Product
}

// Helper function to extract sizes from product_options
const getSizesFromProduct = (product: any): string[] => {
  const sizeOption = product.product_options?.find((opt: any) => opt.name.toLowerCase() === 'size')
  return sizeOption?.product_option_values?.map((v: any) => v.name) || []
}

// Helper function to extract colors from product_options
const getColorsFromProduct = (product: any): string[] => {
  const colorOption = product.product_options?.find((opt: any) => opt.name.toLowerCase() === 'color')
  return colorOption?.product_option_values?.map((v: any) => v.name) || []
}

// Helper function to get color hex from product_option_values
const getColorHexFromOptions = (colorName: string, product: any): string => {
  const colorOption = product.product_options?.find((opt: any) => opt.name.toLowerCase() === 'color')
  const colorValue = colorOption?.product_option_values?.find((v: any) => v.name === colorName)
  return colorValue?.hex_color || '#000000'
}

export default function DesktopProductView({ product }: DesktopProductViewProps) {

  const [selectedColor, setSelectedColor] = useState(getColorFromProduct(product))
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [currentImage, setCurrentImage] = useState(getProductImage(null, product.images))
  const { addToCart, cartItems } = useCart()
  const router = useRouter()
  const [taxSettings, setTaxSettings] = useState<TaxSettings | null>(null)

  // Fetch tax settings
  useEffect(() => {
    async function fetchTaxSettings() {
      const result = await SettingsClientService.getTaxSettings()
      if (result.success && result.data) {
        setTaxSettings(result.data)
      }
    }
    fetchTaxSettings()
  }, [])

  // Check if current selection is in cart
  const variantKey = `${product.id}-${selectedSize}-${selectedColor}`
  const isInCart = cartItems.some(item => item.variantKey === variantKey)

  // FloatingBottomBar shows when there are items in the cart (persistent across refreshes)
  const showFloatingBar = cartItems.length > 0

  // Get all images array
  const allImages = product.images || []

  // Callback for Add to Cart success (can be used for animations/feedback)
  const handleAddToCartSuccess = () => {
    // Bar will automatically show via cart items check
  }

  // Update main image when color or image selection changes
  useEffect(() => {
    // Find the matching variant based on selected size and color
    // First try via variant_option_values join table; fall back to name matching
    let matchingVariant = product.product_variants?.find((variant: any) => {
      const variantOptions = variant.variant_option_values || []
      const hasSize = !selectedSize || variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedSize
      )
      const hasColor = variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedColor
      )
      return hasSize && hasColor
    })

    // Fallback: match by variant.name directly (covers the case where variant_option_values is empty)
    if (!matchingVariant && selectedSize) {
      matchingVariant = product.product_variants?.find((variant: any) =>
        variant.name === selectedSize ||
        variant.name?.toLowerCase().includes(selectedSize.toLowerCase())
      )
    }

    // Use variant images if available, otherwise fallback to product images
    if (matchingVariant?.variant_images && matchingVariant.variant_images.length > 0) {
      const variantImageUrls = matchingVariant.variant_images
        .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
        .map((img: any) => img.image_url)
      const selectedImg = variantImageUrls[selectedImage] || variantImageUrls[0]
      setCurrentImage(selectedImg)
    } else {
      const selectedImg = product.images && product.images[selectedImage]
      setCurrentImage(getProductImage(null, selectedImg ? [selectedImg] : product.images))
    }
  }, [selectedColor, selectedImage, selectedSize, product.images, product.product_variants])

  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
  }

  const [isBuyingNow, setIsBuyingNow] = useState(false)


  const handleBuyNow = async () => {
    if (!selectedSize) {
      toast.error('Please select a size')
      return
    }

    if (isBuyingNow) return
    setIsBuyingNow(true)

    try {
      const buyNowVariantKey = `${product.id}-${selectedSize}-${selectedColor}`
      const alreadyInCart = cartItems.some(item => item.variantKey === buyNowVariantKey)

      // Only add to cart if not already present — prevents duplicate on Buy Now
      if (!alreadyInCart) {
        addToCart({
          id: getVariantId() || product.id,
          product_id: product.id,
          title: product.title,
          price: product.price,
          image: (product.images && product.images[0]) || '',
          size: selectedSize,
          color: selectedColor,
          quantity: quantity,
          variantKey: buyNowVariantKey,
          freeShipping: (product as any).free_shipping ?? false,
        })
        // Small delay to ensure cart state updates before navigation
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Redirect to checkout
      router.push('/checkout')
    } catch (error) {
      console.error('Failed to process Buy Now:', error)
      toast.error('Failed to process request')
      setIsBuyingNow(false)
    }
  }

  // Navigate images
  const handlePrevImage = () => {
    setSelectedImage((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }

  const handleNextImage = () => {
    setSelectedImage((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

  // Get variant ID based on selected options
  const getVariantId = (): string | undefined => {
    if (!product.product_variants || product.product_variants.length === 0) {
      console.warn(`Product ${product.id} has no variants. Order items will fail.`)
      return undefined
    }

    // If no size is selected, don't return any variant — prevents wrong variant being sent
    if (!selectedSize) {
      return undefined
    }

    // 1. Try exact match by variant.name (most reliable — works even when variant_option_values is empty)
    const nameExactMatch = product.product_variants.find((variant: any) =>
      variant.name === selectedSize
    )
    if (nameExactMatch) {
      return nameExactMatch.id
    }

    // 2. Try matching via variant_option_values join table (size + color)
    const matchingVariant = product.product_variants.find((variant: any) => {
      const variantOptions = variant.variant_option_values || []
      if (variantOptions.length === 0) return false

      const hasMatchingSize = variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedSize
      )

      const hasMatchingColor = !selectedColor || variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedColor
      )

      return hasMatchingSize && hasMatchingColor
    })

    if (matchingVariant) {
      return matchingVariant.id
    }

    // 3. Try size-only match via variant_option_values
    const sizeMatch = product.product_variants.find((variant: any) => {
      const variantOptions = variant.variant_option_values || []
      return variantOptions.some((vo: any) => vo.product_option_values?.name === selectedSize)
    })
    if (sizeMatch) {
      return sizeMatch.id
    }

    // 4. Partial name match (e.g. "M" matches "M - 38")
    const namePartialMatch = product.product_variants.find((variant: any) =>
      variant.name?.toLowerCase().includes(selectedSize.toLowerCase())
    )
    if (namePartialMatch) {
      return namePartialMatch.id
    }

    // 5. Smart size-code extraction: extract "L"/"XL"/"XXL" from both strings
    const extractSizeCode = (str: string): string | null => {
      const match = str.match(/\b(XXS|XS|XXXL|XXL|XL|S|M|L)\b/i)
      return match ? match[1].toUpperCase() : null
    }
    const selectedCode = extractSizeCode(selectedSize)
    if (selectedCode) {
      const bySizeCode = product.product_variants.find((v: any) => {
        const variantCode = extractSizeCode(v.name || '')
        return variantCode === selectedCode
      })
      if (bySizeCode) return bySizeCode.id
    }

    console.warn(`Could not find variant match for size: "${selectedSize}", color: "${selectedColor}". Returning undefined to prevent wrong variant.`)
    return undefined
  }

  // Get current variant for SKU display
  const getCurrentVariant = () => {
    if (!product.product_variants) return null

    // 1. Match by variant options if they exist
    const byOptions = product.product_variants.find((variant: any) => {
      // Check options array if available (common in many product APIs)
      if (Array.isArray(variant.options)) {
        const sizeOpt = variant.options.find((o: any) => o.name.toLocaleLowerCase() === 'size')
        if (sizeOpt && sizeOpt.value === selectedSize) return true
      }

      // Check variant_option_values junction table
      const variantOptions = variant.variant_option_values || variant.product_option_values || []
      return variantOptions.some((vo: any) => {
        const optionValue = vo.product_option_value || vo.product_option_values
        return optionValue?.name === selectedSize
      })
    })
    if (byOptions) return byOptions

    // 2. Fallback: match by variant.name
    if (selectedSize) {
      const byName = product.product_variants.find((v: any) =>
        v.name === selectedSize || v.name?.toLowerCase().includes(selectedSize.toLowerCase())
      )
      if (byName) return byName

      // 3. Smart size-code extraction: pull "L", "XL", "XXL", "M", "S" etc. from both
      //    selectedSize (e.g. "XL – 32,34") and variant.name (e.g. "Size XL - Silver Gray")
      const extractSizeCode = (str: string): string | null => {
        const match = str.match(/\b(XXS|XS|XXXL|XXL|XL|S|M|L)\b/i)
        return match ? match[1].toUpperCase() : null
      }
      const selectedCode = extractSizeCode(selectedSize)
      if (selectedCode) {
        const bySizeCode = product.product_variants.find((v: any) => {
          const variantCode = extractSizeCode(v.name || '')
          return variantCode === selectedCode
        })
        if (bySizeCode) return bySizeCode
      }
    }

    // Return nothing if size is selected but no match found
    if (selectedSize) return null

    // Default to first variant if no selection made
    return product.product_variants[0]
  }

  const currentVariant = getCurrentVariant()
  // Prefer inventory_items.quantity (admin source of truth) over product_variants.stock
  const getVariantStock = (v: any) => v?.inventory_items?.quantity ?? v?.stock ?? 0
  const allVariantsOOS = (product.product_variants?.reduce((sum: number, v: any) => sum + getVariantStock(v), 0) || 0) <= 0
  const isOOS = !!selectedSize ? getVariantStock(currentVariant) <= 0 : allVariantsOOS

  return (
    <>
      <div
        className="hidden lg:block bg-gray-50 py-6"
      >
        <div className="container mx-auto px-6 max-w-[1600px]">
          <div className="flex gap-12 items-start relative">
            {/* ═══════════════════════════════════════════════════════════════════
                LEFT SIDE - IMAGE CARD (STICKY)
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="w-1/2 sticky top-32 self-start flex gap-6 z-30">
              {/* Thumbnails - Left Side */}
              <div className="flex flex-col gap-3 w-20 max-h-[600px] overflow-y-auto no-scrollbar py-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onMouseEnter={() => setSelectedImage(idx)}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative shrink-0 w-20 h-24 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${selectedImage === idx
                      ? 'border-black ring-1 ring-black/10'
                      : 'border-transparent hover:border-gray-200'
                      }`}
                  >
                    <Image
                      src={getProductImage(null, [img])}
                      fill
                      alt={`View ${idx + 1}`}
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>

              {/* Main Image Card */}
              <div className="flex-1 relative bg-white rounded-2xl shadow-sm overflow-hidden aspect-4/5 group h-[600px]">
                <Image
                  src={currentImage || '/images/placeholder-product.jpg'}
                  fill
                  alt={product.title}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                {/* Image Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}

                {/* Wishlist Button */}
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10"
                >
                  <Heart
                    className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                  />
                </button>

                {/* Share Button */}
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: product.title,
                        text: `Check out ${product.title}`,
                        url: window.location.href,
                      })
                    } else {
                      navigator.clipboard.writeText(window.location.href)
                      toast.success('Link copied to clipboard!')
                    }
                  }}
                  className="absolute top-4 left-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all z-10"
                >
                  <Upload className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                RIGHT SIDE - PRODUCT INFO
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="w-1/2 space-y-6 py-2 pb-20 overflow-hidden min-w-0">
              {/* Category Badge */}
              {product.product_categories?.[0]?.categories?.name && (
                <span className="inline-block text-xs font-semibold text-red-600 uppercase tracking-wider bg-red-50 px-3 py-1.5 rounded-full">
                  {product.product_categories[0].categories.name}
                </span>
              )}

              {/* Product Title */}
              <h1 className="text-3xl lg:text-4xl font-heading font-bold text-gray-900 leading-tight">
                {product.title}
              </h1>

              {/* Rating & Reviews */}
              {product.review_count ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-gray-900">
                      {product.average_rating?.toFixed(1) || '0.0'}
                    </span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{product.review_count} reviews</span>
                </div>
              ) : null}

              {/* SKU & Variant Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm">

                {selectedSize && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                    Size: {selectedSize}
                  </span>
                )}
              </div>

              {/* Divider */}
              <hr className="border-gray-200" />

              {/* Pricing */}
              <div className="space-y-1">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    {/* Calculate dynamic price */}
                    {(() => {
                      const priceToDisplay = currentVariant?.price || product.price
                      const finalDisplayPrice = priceToDisplay > 0 ? priceToDisplay : (
                        product.product_variants?.length ? Math.min(...product.product_variants.map((v: any) => v.price).filter((p: any) => p > 0)) : 0
                      )
                      return `₹${finalDisplayPrice.toLocaleString('en-IN')}`
                    })()}
                  </span>

                  {/* Calculate MRP and Discount */}
                  {(() => {
                    const priceToDisplay = currentVariant?.price || product.price
                    const finalDisplayPrice = priceToDisplay > 0 ? priceToDisplay : (
                      product.product_variants?.length ? Math.min(...product.product_variants.map((v: any) => v.price).filter((p: any) => p > 0)) : 0
                    )

                    // Prioritize variant MRP (discount_price), fallback to product compare_price
                    const mrp = currentVariant?.discount_price || product.compare_price

                    if (mrp && mrp > finalDisplayPrice) {
                      const discount = Math.round(((mrp - finalDisplayPrice) / mrp) * 100)
                      return (
                        <>
                          <span className="text-lg text-gray-400 line-through">
                            ₹{mrp.toLocaleString('en-IN')}
                          </span>
                          <span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            {discount}% OFF
                          </span>
                        </>
                      )
                    }
                    return null
                  })()}
                </div>

                {/* Tax Note - Only show if tax enabled globally AND product is taxable AND price includes tax */}
                {taxSettings?.tax_enabled && (product.taxable ?? true) && taxSettings?.price_includes_tax && (
                  <p className="text-sm text-gray-500">Inclusive of all taxes</p>
                )}
                {taxSettings?.tax_enabled && (product.taxable ?? true) && !taxSettings?.price_includes_tax && (
                  <p className="text-sm text-gray-500">Tax to be added at checkout</p>
                )}

                {/* Stock Status */}
                {currentVariant && (
                  <div className="text-sm mt-1">
                    {getVariantStock(currentVariant) >= 10 ? (
                      <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded text-xs">In Stock</span>
                    ) : getVariantStock(currentVariant) > 0 ? (
                      <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded text-xs">⚡ Only {getVariantStock(currentVariant)} left</span>
                    ) : (
                      <span className="text-red-600 font-medium bg-red-50 px-2 py-0.5 rounded text-xs">Out of Stock</span>
                    )}
                  </div>
                )}
              </div>

              {/* Color Variant Selector */}
              <ColorVariantSelector
                currentProductId={product.id}
                productFamilyId={product.product_family_id}
                currentColorName={selectedColor}
                currentProduct={product}
              />

              {/* Product Options (Size, Color) */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <ProductOptions
                  sizes={getSizesFromProduct(product)}
                  colors={[]}
                  rating={product.average_rating || undefined}
                  reviews={product.review_count || undefined}
                  selectedSize={selectedSize}
                  selectedColor={{
                    name: selectedColor,
                    hex: getColorHexFromOptions(selectedColor, product),
                    image: (product.images && product.images[0]) || ''
                  }}
                  onSizeSelect={setSelectedSize}
                  onColorSelect={(color) => handleColorSelect(color.name)}
                  variant="desktop"
                />
              </div>

              {/* Add to Cart & Buy Now */}
              {/* Quantity Selector */}
              <div className="pt-4">
                <div className="flex items-center bg-white border border-gray-200 rounded-lg h-12 w-32">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={!selectedSize || quantity <= 1}
                    className="w-10 h-full flex items-center justify-center hover:bg-gray-50 transition-colors rounded-l-lg disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="flex-1 text-center font-bold text-gray-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!selectedSize}
                    className="w-10 h-full flex items-center justify-center hover:bg-gray-50 transition-colors rounded-r-lg disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart & Buy Now */}
              <div className="flex gap-4 pt-2 ml-2">
                {!isOOS && (
                  <AddToCartButton
                    productId={product.id}
                    productTitle={product.title}
                    productPrice={product.price}
                    productImage={(product.images && product.images[0]) || ''}
                    selectedSize={selectedSize}
                    selectedColor={{
                      name: selectedColor,
                      hex: getColorHexFromOptions(selectedColor, product),
                      image: (product.images && product.images[0]) || ''
                    }}
                    variant="desktop"
                    variantId={getVariantId()}
                    onAddSuccess={handleAddToCartSuccess}
                    quantity={quantity}
                    hideQuantitySelector={true}
                    className="flex-1"
                    customStyle="h-14 rounded-lg font-bold text-sm bg-white border-2 border-black text-black hover:bg-gray-100 uppercase tracking-wide w-full"
                    icon={<ShoppingCart className="w-5 h-5 fill-black" />}
                    stock={getVariantStock(currentVariant)}
                    freeShipping={(product as any).free_shipping ?? false}
                  />
                )}

                {/* Buy Now Button */}
                <button
                  onClick={handleBuyNow}
                  disabled={!selectedSize || isBuyingNow || isOOS}
                  className={`flex-1 h-14 rounded-lg font-bold uppercase tracking-wide transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2 ${isOOS
                    ? 'bg-gray-100 text-gray-400 border border-gray-200'
                    : 'bg-black text-white hover:bg-gray-800 disabled:opacity-50'
                    }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  {isOOS ? 'OUT OF STOCK' : isBuyingNow ? 'PROCESSING...' : 'BUY NOW'}
                </button>
              </div>

              {/* Product Description - Full Width */}
              <ProductDescription
                description={product.description}
                variant="desktop"
              />
            </div>
          </div>


        </div>
      </div>

      {/* Floating Bottom Bar - Only visible on desktop */}
      <div className="hidden lg:block">
        <FloatingBottomBar
          isVisible={showFloatingBar}
          selectedColor={{
            name: selectedColor,
            hex: getColorHexFromOptions(selectedColor, product),
            image: currentImage || ''
          }}
          price={currentVariant?.price || product.price}
          onBuyNow={handleBuyNow}
          isMobile={false}
          isOutOfStock={isOOS}
        />
      </div>
    </>
  )
}