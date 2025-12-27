'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Heart, Upload } from 'lucide-react'
import { motion } from 'framer-motion'
import ProductOptions from './ProductOptions'
import AddToCartButton from './AddToCartButton'
import FloatingBottomBar from './FloatingBottomBar'

import { Product } from '@/domains/product'
import { getProductImage } from '@/domains/product/utils/getProductImage'
import { useCart } from '@/domains/cart'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
  const { addToCart } = useCart()
  const router = useRouter()

  useEffect(() => {
    // Show floating bar when size is selected
    setShowFloatingBar(!!selectedSize)
  }, [selectedSize])

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
    if (!selectedSize) return
    const variantId = getVariantId()

    addToCart({
      id: variantId || product.id, // Use variant ID for checkout compatibility
      title: product.title,
      price: product.price,
      image: currentImage,
      size: selectedSize,
      color: selectedColor,
      variantKey: `${product.id}-${selectedSize}-${selectedColor}`,
    })

    router.push('/checkout')
  }

  // Get variant ID based on selected options
  // IMPORTANT: Must match selected size AND color to find the correct variant
  const getVariantId = (): string | undefined => {
    if (!product.product_variants || product.product_variants.length === 0) {
      console.warn(`Product ${product.id} has no variants. Order items will fail.`)
      return undefined
    }

    // Find variant matching selected size and color
    const matchingVariant = product.product_variants.find((variant: any) => {
      const variantOptions = variant.variant_option_values || []

      // Check if variant has matching size (if size is selected)
      const hasMatchingSize = !selectedSize || variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedSize
      )

      // Check if variant has matching color
      const hasMatchingColor = variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedColor
      )

      return hasMatchingSize && hasMatchingColor
    })

    if (matchingVariant) {
      return matchingVariant.id
    }

    // Fallback: if no exact match, try to find by size only
    if (selectedSize) {
      const sizeMatch = product.product_variants.find((variant: any) => {
        const variantOptions = variant.variant_option_values || []
        return variantOptions.some((vo: any) => vo.product_option_values?.name === selectedSize)
      })
      if (sizeMatch) return sizeMatch.id
    }

    // Final fallback: return first variant
    console.warn(`Could not find exact variant match for size:${selectedSize} color:${selectedColor}. Using first variant.`)
    return product.product_variants[0].id
  }

  return (
    <>
      <motion.div
        className="hidden lg:block bg-gray-50"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Main Product Card with Image Background */}
        <div className="container mx-auto px-4 py-6 md:py-8 max-w-[1400px]">
          <div className="relative bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Full Width Background Image */}
            <div className="relative w-full h-[450px] md:h-[520px] lg:h-[580px]">
              <Image
                src={currentImage || '/images/placeholder-product.jpg'}
                fill
                alt={product.title}
                className="object-cover"
                priority
              />

              {/* Overlay Content */}
              <div className="absolute inset-0 p-6 md:p-8 lg:p-12">
                <div className="h-full flex flex-col lg:flex-row justify-between items-center gap-8">
                  {/* Left Side - Product Info */}
                  <div className="flex-1 flex flex-col justify-between max-w-xl h-full">
                    <div className="space-y-3">
                      {/* Category Name */}
                      {product.product_categories?.[0]?.categories?.name && (
                        <p className="text-sm font-medium text-red-600 uppercase tracking-wide">
                          {product.product_categories[0].categories.name.toUpperCase()}
                        </p>
                      )}

                      {/* Title */}
                      <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-gray-900 leading-tight">
                        {product.title}
                      </h1>

                      {/* Description */}
                      {product.description && (
                        <p className="text-sm text-gray-700 leading-relaxed max-w-md">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Thumbnail Images */}
                    <div className="flex gap-3 mt-auto">
                      {(product.images || []).slice(0, 4).map((img, idx) => (
                        <button
                          key={idx}
                          onMouseEnter={() => setSelectedImage(idx)}
                          onClick={() => setSelectedImage(idx)}
                          className={`relative flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all bg-white hover:scale-105 ${selectedImage === idx
                            ? 'border-black'
                            : 'border-gray-300 hover:border-gray-500'
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
                      {(product.images || []).length > 4 && (
                        <div className="flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg bg-gray-900 flex items-center justify-center text-xs font-medium text-white">
                          +{(product.images || []).length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Product Options & CTA - Centered */}
                  <div className="w-full lg:w-72 bg-white/95 backdrop-blur-sm rounded-xl p-5 space-y-4 self-center relative">
                    {/* Share Button - Top Right of Card */}
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
                      className="absolute -top-2 -right-2 w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-all shadow-sm"
                      title="Share"
                    >
                      <Upload className="w-3.5 h-3.5 text-gray-700" />
                    </button>

                    <ProductOptions
                      sizes={getSizesFromProduct(product)}
                      colors={getColorsFromProduct(product).map(color => ({ name: color, hex: getColorHexFromOptions(color, product), image: (product.images && product.images[0]) || '' }))}
                      rating={product.average_rating || undefined}
                      reviews={product.review_count || undefined}
                      selectedSize={selectedSize}
                      selectedColor={{ name: selectedColor, hex: '#000000', image: (product.images && product.images[0]) || '' }}
                      onSizeSelect={setSelectedSize}
                      onColorSelect={(color) => handleColorSelect(color.name)}
                      variant="desktop"
                    />

                    {/* Price */}
                    <div>
                      <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-1">
                        PRICE
                      </h3>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </p>
                    </div>

                    {/* Add to Cart & Wishlist */}
                    <div className="flex gap-2 pt-2">
                      <AddToCartButton
                        productId={product.id}
                        productTitle={product.title}
                        productPrice={product.price}
                        productImage={(product.images && product.images[0]) || ''}
                        selectedSize={selectedSize}
                        selectedColor={{ name: selectedColor, hex: '#000000', image: (product.images && product.images[0]) || '' }}
                        variant="desktop"
                        variantId={getVariantId()}
                      />
                      <button
                        onClick={() => setIsWishlisted(!isWishlisted)}
                        className="w-11 h-11 rounded-lg border-2 border-gray-300 bg-white flex items-center justify-center hover:border-red-500 hover:bg-red-50 transition-all"
                        title="Add to Wishlist"
                      >
                        <Heart
                          className={`w-5 h-5 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
                            }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating Bottom Bar */}
      <FloatingBottomBar
        isVisible={showFloatingBar}
        selectedColor={{ name: selectedColor, hex: '#000000', image: (product.images && product.images[0]) || '' }}
        price={product.price}
        onBuyNow={handleBuyNow}
        isMobile={false}
      />
    </>
  )
}
