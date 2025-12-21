'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Plus, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useCart, useCartSound, type CartItem } from '@/domains/cart'
import { Product } from '@/domains/product'
import { createClient } from '@/lib/supabase/client'

interface ComboProduct {
  id: string
  title: string
  price: number
  image: string
  selected: boolean
}

interface FrequentlyBoughtTogetherProps {
  productId: string
  currentProduct: {
    id: string
    title: string
    price: number
    image: string
  }
}

export default function FrequentlyBoughtTogether({
  productId,
  currentProduct,
}: FrequentlyBoughtTogetherProps) {
  const [products, setProducts] = useState<ComboProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdded, setIsAdded] = useState(false)
  const playCartSound = useCartSound()
  const { cartItems, addToCart } = useCart()

  // Fetch FBT products on mount
  useEffect(() => {
    async function loadFBTProducts() {
      setIsLoading(true)
      try {
        const supabase = createClient()

        // Fetch products with their images
        const { data: allProducts } = await supabase
          .from('products')
          .select(`
            id,
            title,
            price,
            in_stock,
            product_images (
              image_url,
              is_primary
            )
          `)
          .eq('in_stock', true)
          .eq('status', 'published')
          .neq('id', productId)
          .limit(5)

        const fbtProducts = (allProducts || []).slice(0, 2)

        if (fbtProducts.length > 0) {
          // Add current product as first item (always selected)
          const comboProducts: ComboProduct[] = [
            {
              id: currentProduct.id,
              title: currentProduct.title,
              price: currentProduct.price,
              image: currentProduct.image,
              selected: true,
            },
            ...fbtProducts.map((p: any) => {
              // Get primary image or first image from product_images
              const primaryImage = p.product_images?.find((img: any) => img.is_primary)
              const firstImage = p.product_images?.[0]
              const imageUrl = primaryImage?.image_url || firstImage?.image_url || '/images/placeholder-product.jpg'

              return {
                id: p.id,
                title: p.title,
                price: p.price,
                image: imageUrl,
                selected: true,
              }
            }),
          ]
          setProducts(comboProducts)
        }
      } catch (error) {
        console.error('Error loading FBT products:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadFBTProducts()
  }, [productId, currentProduct])

  // If loading or no products, don't show section
  if (isLoading) {
    return (
      <section className="py-12 md:py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-7xl flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </section>
    )
  }

  if (products.length === 0) {
    return null
  }

  // Check if FBT items are already in cart
  const hasFBTItems = cartItems.some((item: CartItem) =>
    products.slice(1).some(p => p.id === item.id)
  )

  const totalPrice = products
    .filter((p) => p.selected)
    .reduce((sum, p) => sum + p.price, 0)
  const originalPrice = products.reduce((sum, p) => sum + p.price, 0)
  const selectedCount = products.filter((p) => p.selected).length
  const discount = selectedCount > 1 ? Math.floor(totalPrice * 0.05) : 0 // 5% discount for combo
  const finalPrice = totalPrice - discount

  const toggleProduct = (id: string) => {
    // Don't allow toggling if already added
    if (hasFBTItems) return

    setProducts(
      products.map((p) => (p.id === id ? { ...p, selected: !p.selected } : p))
    )
  }

  const handleAddToCart = () => {
    // Prevent adding if already added
    if (hasFBTItems) {
      alert('FBT items already added to cart')
      return
    }

    const selectedProducts = products.filter(p => p.selected)
    if (selectedProducts.length === 0) {
      alert('Please select at least one product')
      return
    }

    // Play cart sound
    playCartSound()

    // Add selected products to cart context (skip first product as it's the main product)
    selectedProducts.slice(1).forEach(product => {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        variantKey: `fbt-${product.id}`,
        isFBT: true
      })
    })

    // Show success state
    setIsAdded(true)
  }

  return (
    <section className="py-12 md:py-16 px-4 bg-gray-50">
      <div className="container mx-auto max-w-7xl">
        <h2 className="text-2xl md:text-3xl font-heading tracking-wider mb-6 text-center">
          FREQUENTLY BOUGHT TOGETHER
        </h2>

        <div className="bg-white rounded-2xl p-4 md:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
            {/* Product Cards - Takes more space on desktop */}
            <div className="flex justify-center items-center gap-2 md:gap-6 w-full lg:flex-1">
              {products.map((product, index) => (
                <div key={product.id} className="flex items-center">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`relative ${product.selected ? 'opacity-100' : 'opacity-50'
                      }`}
                  >
                    <div className="relative w-20 h-20 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-lg md:rounded-2xl overflow-hidden border-2 md:border-4 border-gray-200">
                      <Image
                        src={product.image}
                        fill
                        alt={product.title}
                        className="object-cover"
                      />
                    </div>
                    <button
                      onClick={() => toggleProduct(product.id)}
                      className={`absolute -top-1 -right-1 md:-top-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all ${product.selected
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                        }`}
                    >
                      {product.selected ? '✓' : '○'}
                    </button>
                  </motion.div>
                  {index < products.length - 1 && (
                    <Plus className="w-4 h-4 md:w-8 md:h-8 mx-1 md:mx-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {/* Pricing & CTA - Compact on desktop */}
            <div className="text-center lg:text-left w-full lg:w-auto lg:min-w-[280px]">
              <div className="mb-4 md:mb-6">
                <p className="text-xs md:text-sm text-gray-600 font-body mb-2 uppercase tracking-wide">Total Price</p>
                <div className="flex items-center justify-center lg:justify-start gap-2 md:gap-3 flex-wrap">
                  <span className="text-2xl md:text-4xl font-heading">
                    ₹{finalPrice.toLocaleString('en-IN')}
                  </span>
                  {discount > 0 && (
                    <span className="text-lg md:text-2xl line-through text-gray-400 font-heading">
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <p className="text-green-600 font-body text-xs md:text-sm font-medium mt-2">
                    Save ₹{discount.toLocaleString('en-IN')} on this combo!
                  </p>
                )}
              </div>

              <motion.button
                whileHover={{ scale: hasFBTItems || isAdded ? 1 : 1.02 }}
                whileTap={{ scale: hasFBTItems || isAdded ? 1 : 0.98 }}
                onClick={handleAddToCart}
                disabled={hasFBTItems || isAdded}
                className={`w-full px-6 md:px-8 py-3 md:py-4 text-white text-sm md:text-base font-medium tracking-wide rounded-lg transition-all ${isAdded || hasFBTItems ? 'bg-green-600 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
                  }`}
              >
                {isAdded || hasFBTItems ? '✓ ADDED TO CART' : 'ADD SELECTED TO CART'}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
