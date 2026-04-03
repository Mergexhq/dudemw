'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Minus, ShoppingCart, ShoppingBag, Heart, ChevronLeft, Upload, Zap } from 'lucide-react'
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

interface MobileProductViewProps {
  product: Product
}

// Helper function to extract sizes from product_options (or fall back to variant names)
const getSizesFromProduct = (product: any): string[] => {
  // Primary: read from product_options join table
  const sizeOption = product.product_options?.find((opt: any) => opt.name.toLowerCase() === 'size')
  const fromOptions = sizeOption?.product_option_values?.map((v: any) => v.name) || []
  if (fromOptions.length > 0) return fromOptions

  // Fallback: derive sizes from variant names (covers products where options is empty)
  // e.g. variant.name = "M – 38" → display label "M – 38"
  const variants = product.product_variants || []
  if (variants.length === 0) return []
  return variants
    .filter((v: any) => v.name && v.active !== false)
    .map((v: any) => v.name as string)
}

// Helper function to extract colors from product_options  
const getColorsFromProduct = (product: Product): string[] => {
  const colorOption = product.product_options?.find((opt: any) => opt.name.toLowerCase() === 'color')
  return colorOption?.product_option_values?.map((v: any) => v.name) || []
}

// Helper function to get color hex from product_option_values
const getColorHexFromOptions = (colorName: string, product: Product): string => {
  const colorOption = product.product_options?.find((opt: any) => opt.name.toLowerCase() === 'color')
  const colorValue = colorOption?.product_option_values?.find((v: any) => v.name === colorName)
  return colorValue?.hex_color || getColorHex(colorName)
}

// Helper function to convert string colors to ProductColor objects
const getColorHex = (colorName: string): string => {
  const colorMap: { [key: string]: string } = {
    'White': '#FFFFFF',
    'Black': '#000000',
    'Gray': '#808080',
    'Grey': '#808080',
    'Navy': '#000080',
    'Blue': '#0000FF',
    'Light Blue': '#ADD8E6',
    'Red': '#FF0000',
    'Maroon': '#800000',
    'Green': '#008000',
    'Pink': '#FFC0CB',
    'Khaki': '#F0E68C',
    'Brown': '#A52A2A',
    'Olive': '#808000',
    'Charcoal': '#36454F'
  }
  return colorMap[colorName] || '#000000'
}

const convertToProductColors = (product: Product) => {
  const colors = getColorsFromProduct(product)
  return colors.map(color => ({
    name: color,
    hex: getColorHexFromOptions(color, product),
    image: product.images?.[0] || ''
  }))
}

export default function MobileProductView({ product }: MobileProductViewProps) {
  const productColors = convertToProductColors(product)
  const initialColorName = getColorFromProduct(product)
  const [selectedColor, setSelectedColor] = useState(productColors[0] || {
    name: initialColorName,
    hex: getColorHex(initialColorName),
    image: getProductImage(null, product.images)
  })
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [currentImage, setCurrentImage] = useState(getProductImage(null, product.images))
  const { addToCart, cartItems, isLoading } = useCart()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // FloatingBottomBar shows when cart is loaded and has items
  const showFloatingBar = isMounted && !isLoading && cartItems.length > 0

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
        vo.product_option_values?.name === selectedColor.name
      )
      return hasSize && hasColor
    })

    // Fallback: match by variant.name directly (covers stores where variant_option_values is empty)
    if (!matchingVariant && selectedSize) {
      matchingVariant = product.product_variants?.find((variant: any) =>
        variant.name === selectedSize ||
        variant.name?.toLowerCase().includes(selectedSize.toLowerCase())
      )
    }

    // Fallback 2: Smart size-code extraction
    if (!matchingVariant && selectedSize) {
      const extractSizeCode = (str: string): string | null => {
        const match = str.match(/\b(XXS|XS|XXXL|XXL|XL|S|M|L)\b/i)
        return match ? match[1].toUpperCase() : null
      }
      const selectedCode = extractSizeCode(selectedSize)
      if (selectedCode) {
        matchingVariant = product.product_variants?.find((v: any) => {
          const variantCode = extractSizeCode(v.name || '')
          return variantCode === selectedCode
        })
      }
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

  // Check if current selection is in cart
  const variantKey = `${product.id}-${selectedSize}-${selectedColor.name}`
  const isInCart = cartItems.some(item => item.variantKey === variantKey)

  const handleColorSelect = (color: { name: string; hex: string; image: string }) => {
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
      const buyNowVariantKey = `${product.id}-${selectedSize}-${selectedColor.name}`
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
  color: selectedColor.name,
  quantity: 1,
  variantKey: buyNowVariantKey,
  freeShipping: (product as any).free_shipping ?? false,
})
        // Small delay to ensure cart state updates before navigation
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      router.push('/checkout')
    } catch (error) {
      console.error('Failed to process Buy Now:', error)
      toast.error('Failed to process request')
      setIsBuyingNow(false)
    }
  }

  // Get variant ID based on selected options
  // IMPORTANT: Must match selected size AND color to find the correct variant
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

      const hasMatchingColor = !selectedColor.name || variantOptions.some((vo: any) =>
        vo.product_option_values?.name === selectedColor.name
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

    console.warn(`Could not find variant match for size: "${selectedSize}", color: "${selectedColor.name}". Returning undefined to prevent wrong variant.`)
    return undefined
  }

  // Get current variant for price display
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

      // 3. Smart size-code extraction: pull "L", "XL", "XXL" etc. from both
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
    <div className="lg:hidden bg-white min-h-screen pb-24 w-full max-w-full">
      {/* Image Card Only */}
      <motion.div
        className="px-4 pt-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative aspect-3/4 overflow-hidden rounded-2xl shadow-lg">
          <Image
            src={currentImage || '/images/placeholder-product.jpg'}
            fill
            alt={product.title}
            className="object-cover"
            priority
          />

          {/* Back and Like Icons - Overlaid on Image */}
          <div className="absolute top-4 left-0 right-0 z-20 flex items-center justify-between px-4">
            <button
              onClick={() => window.history.back()}
              className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-all shadow-md"
            >
              <ChevronLeft className="w-6 h-6 text-gray-900" />
            </button>
            <button
              onClick={() => setIsWishlisted(!isWishlisted)}
              className={`w-10 h-10 backdrop-blur-md rounded-full flex items-center justify-center transition-all shadow-md ${isWishlisted
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-white/90 hover:bg-white'
                }`}
            >
              <Heart
                className={`w-5 h-5 ${isWishlisted ? 'fill-white text-white' : 'text-gray-900'
                  }`}
              />
            </button>
          </div>

          {/* Thumbnail Images - Bottom Overlay */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {(product.images || []).slice(0, 4).map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx
                    ? 'border-black scale-105'
                    : 'border-black/40'
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
            </div>
          </div>
        </div>
      </motion.div>

      {/* Title and Description - Outside Card */}
      <motion.div
        className="px-4 pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Category Name */}
        {product.product_categories?.[0]?.categories?.name && (
          <p className="text-sm font-medium text-red-600 mb-1 uppercase tracking-wide">
            {product.product_categories[0].categories.name.toUpperCase()}
          </p>
        )}

        <h1 className="text-lg font-heading font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
          {product.title}
        </h1>
      </motion.div>

      {/* Product Details - Cardless */}
      <motion.div
        className="px-4 w-full max-w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Price */}
        <div className="flex items-baseline gap-3 mb-6">
          <p className="text-3xl font-bold text-gray-900">
            {/* Calculate dynamic price */}
            {(() => {
              const priceToDisplay = currentVariant?.price || product.price
              const finalDisplayPrice = priceToDisplay > 0 ? priceToDisplay : (
                product.product_variants?.length ? Math.min(...product.product_variants.map((v: any) => v.price).filter((p: any) => p > 0)) : 0
              )
              return `₹${finalDisplayPrice.toLocaleString('en-IN')}`
            })()}
          </p>

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

        {/* Stock Status */}
        {currentVariant && (
          <div className="text-sm mb-4">
            {getVariantStock(currentVariant) >= 10 ? (
              <span className="text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full text-xs">In Stock</span>
            ) : getVariantStock(currentVariant) > 0 ? (
              <span className="text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full text-xs">⚡ Only {getVariantStock(currentVariant)} left</span>
            ) : (
              <span className="text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full text-xs">Out of Stock</span>
            )}
          </div>
        )}

        {/* Color Variant Selector */}
        <ColorVariantSelector
          currentProductId={product.id}
          productFamilyId={product.product_family_id}
          currentColorName={selectedColor.name}
          currentProduct={product}
        />

        <ProductOptions
          sizes={getSizesFromProduct(product)}
          colors={[]}
          rating={product.average_rating || undefined}
          reviews={product.review_count || undefined}
          selectedSize={selectedSize}
          selectedColor={selectedColor}
          onSizeSelect={setSelectedSize}
          onColorSelect={handleColorSelect}
          variant="mobile"
        />

        {/* Add to Cart and Share Buttons */}
        {/* Quantity Selector */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center bg-gray-100 rounded-lg h-12">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={!selectedSize || quantity <= 1}
              className="w-12 h-full flex items-center justify-center hover:bg-gray-200 transition-colors rounded-l-lg disabled:opacity-30"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              disabled={!selectedSize}
              className="w-12 h-full flex items-center justify-center hover:bg-gray-200 transition-colors rounded-r-lg disabled:opacity-30"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Add to Cart and Buy Now Buttons */}
        <div className="flex gap-3 mb-4">
          {!isOOS && (
            <AddToCartButton
              productId={product.id}
              productTitle={product.title}
              productPrice={product.price}
              productImage={(product.images && product.images[0]) || ''}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              variant="mobile"
              variantId={getVariantId()}
              onAddSuccess={handleAddToCartSuccess}
              quantity={quantity}
              hideQuantitySelector={true}
              className="flex-1"
              customStyle="h-14 rounded-lg font-bold text-sm bg-white border-2 border-black text-black hover:bg-gray-100 uppercase tracking-wide"
              icon={<ShoppingCart className="w-5 h-5 fill-black" />}
stock={getVariantStock(currentVariant)}
freeShipping={(product as any).free_shipping ?? false}
/>
          )}
          {/* Buy Now Button */}
          <button
            onClick={handleBuyNow}
            disabled={!selectedSize || isBuyingNow || isOOS}
            className={`flex-1 h-14 rounded-lg font-bold uppercase tracking-wide transition-all disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2 ${isOOS
              ? 'bg-gray-100 text-gray-400 border border-gray-200'
              : 'bg-black text-white hover:bg-gray-800 disabled:opacity-50'
              }`}
          >
            <ShoppingBag className="w-5 h-5" />
            {isOOS ? 'OUT OF STOCK' : isBuyingNow ? 'Processing...' : 'BUY NOW'}
          </button>
        </div>
      </motion.div>

      {/* Product Description - Full Width */}
      <ProductDescription
        description={product.description}
        variant="mobile"
      />

      {/* Floating Bottom Bar - Only visible on mobile */}
      <div className="lg:hidden">
        <FloatingBottomBar
          isVisible={showFloatingBar}
          selectedColor={{
            ...selectedColor,
            image: currentImage || ''
          }}
          price={currentVariant?.price || product.price}
          onBuyNow={handleBuyNow}
          isMobile={true}
          isOutOfStock={isOOS}
        />
      </div>
    </div>
  )
}