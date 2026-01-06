'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Heart, Upload, Star, Package, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import ProductOptions from './ProductOptions'
import AddToCartButton from './AddToCartButton'
import FloatingBottomBar from './FloatingBottomBar'

import { Product } from '@/domains/product'
import { getProductImage } from '@/domains/product/utils/getProductImage'
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
  const colors = getColorsFromProduct(product)
  const [selectedColor, setSelectedColor] = useState(colors[0] || 'Black')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [showFloatingBar, setShowFloatingBar] = useState(false)
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

  // Sync floating bar with cart state
  useEffect(() => {
    setShowFloatingBar(isInCart)
  }, [isInCart])

  // Get all images array
  const allImages = product.images || []

  // FloatingBottomBar now shows only when item is added to cart
  const handleAddToCartSuccess = () => {
    setShowFloatingBar(true)
  }

  // Update main image when color or image selection changes
  useEffect(() => {
    // Find the matching variant based on selected size and color
    const matchingVariant = product.product_variants?.find((variant: any) => {
      const variantOptions = variant.variant_option_values || []
      const hasSize = !selectedSize || variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedSize
      )
      const hasColor = variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedColor
      )
      return hasSize && hasColor
    })

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

  const handleBuyNow = () => {
    // Item is already in cart when FloatingBottomBar appears (via Add to Cart button)
    // Just navigate to checkout - don't add again or quantity will double
    router.push('/checkout')
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

    const matchingVariant = product.product_variants.find((variant: any) => {
      const variantOptions = variant.variant_option_values || []
      const hasMatchingSize = !selectedSize || variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedSize
      )
      const hasMatchingColor = variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedColor
      )
      return hasMatchingSize && hasMatchingColor
    })

    if (matchingVariant) {
      return matchingVariant.id
    }

    if (selectedSize) {
      const sizeMatch = product.product_variants.find((variant: any) => {
        const variantOptions = variant.variant_option_values || []
        return variantOptions.some((vo: any) => vo.product_option_values?.name === selectedSize)
      })
      if (sizeMatch) return sizeMatch.id
    }

    console.warn(`Could not find exact variant match for size:${selectedSize} color:${selectedColor}. Using first variant.`)
    return product.product_variants[0].id
  }

  // Get current variant for SKU display
  const getCurrentVariant = () => {
    return product.product_variants?.find((variant: any) => {
      const variantOptions = variant.variant_option_values || []
      const hasSize = !selectedSize || variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedSize
      )
      const hasColor = variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedColor
      )
      return hasSize && hasColor
    }) || product.product_variants?.[0]
  }

  const currentVariant = getCurrentVariant()

  return (
    <>
      <motion.div
        className="hidden lg:block bg-gray-50 py-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="container mx-auto px-6 max-w-[1600px]">
          <div className="grid grid-cols-2 gap-8">
            {/* ═══════════════════════════════════════════════════════════════════
                LEFT SIDE - IMAGE CARD
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="space-y-4">
              {/* Main Image Card */}
              <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden aspect-[4/5] group">
                <Image
                  src={currentImage || '/images/placeholder-product.jpg'}
                  fill
                  alt={product.title}
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  priority
                />

                {/* Image Navigation Arrows */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <button
                      onClick={handleNextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                    {selectedImage + 1} / {allImages.length}
                  </div>
                )}

                {/* Wishlist Button */}
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all"
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
                  className="absolute top-4 left-4 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all"
                >
                  <Upload className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Thumbnail Strip */}
              <div className="flex gap-3 justify-center">
                {allImages.slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    onMouseEnter={() => setSelectedImage(idx)}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${selectedImage === idx
                      ? 'border-gray-900 ring-2 ring-gray-900/20'
                      : 'border-gray-200 hover:border-gray-400'
                      }`}
                  >
                    <Image
                      src={getProductImage(null, [img])}
                      fill
                      alt={`View ${idx + 1}`}
                      className="object-cover"
                    />
                  </button>
                ))}
                {allImages.length > 5 && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-gray-900 flex items-center justify-center text-sm font-semibold text-white">
                    +{allImages.length - 5}
                  </div>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                RIGHT SIDE - PRODUCT INFO
            ═══════════════════════════════════════════════════════════════════ */}
            <div className="space-y-6 py-2">
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

              {/* Description */}
              {product.description && (
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* SKU & Variant Info */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                {currentVariant?.sku && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Package className="w-4 h-4" />
                    <span>SKU: <span className="font-mono text-gray-700">{currentVariant.sku}</span></span>
                  </div>
                )}
                {selectedSize && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium">
                    Size: {selectedSize}
                  </span>
                )}
                {selectedColor && (
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: getColorHexFromOptions(selectedColor, product) }}
                    />
                    {selectedColor}
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
              </div>

              {/* Product Options (Size, Color) */}
              <div className="bg-gray-50 rounded-xl p-5 space-y-4">
                <ProductOptions
                  sizes={getSizesFromProduct(product)}
                  colors={getColorsFromProduct(product).map(color => ({
                    name: color,
                    hex: getColorHexFromOptions(color, product),
                    image: (product.images && product.images[0]) || ''
                  }))}
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
              <div className="flex gap-3 pt-2">
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
                />
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className="w-12 h-12 rounded-xl border-2 border-gray-200 bg-white flex items-center justify-center hover:border-red-500 hover:bg-red-50 transition-all"
                  title="Add to Wishlist"
                >
                  <Heart
                    className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                  />
                </button>
              </div>

              {/* Stock Status */}
              {currentVariant && (
                <div className="text-sm">
                  {currentVariant.stock > 10 ? (
                    <span className="text-green-600 font-medium">✓ In Stock</span>
                  ) : currentVariant.stock > 0 ? (
                    <span className="text-amber-600 font-medium">⚡ Only {currentVariant.stock} left</span>
                  ) : (
                    <span className="text-red-600 font-medium">✗ Out of Stock</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Bottom Bar */}
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
      />
    </>
  )
}
