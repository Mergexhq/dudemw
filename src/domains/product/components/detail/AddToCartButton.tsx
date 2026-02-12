'use client'

import { useState } from 'react'
import { useCart, type CartItem } from '@/domains/cart'
import { Plus, ShoppingCart, Minus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface AddToCartButtonProps {
  productId: string
  productTitle: string
  productPrice: number
  productImage: string
  selectedSize: string
  selectedColor: { name: string; hex: string; image: string }
  variant?: 'mobile' | 'desktop'
  className?: string
  variantId?: string // Product variant ID
  onAddSuccess?: () => void // Callback when item is successfully added
}

export default function AddToCartButton({
  productId,
  productTitle,
  productPrice,
  productImage,
  selectedSize,
  selectedColor,
  variant = 'mobile',
  className = '',
  variantId,
  onAddSuccess
}: AddToCartButtonProps) {
  const [localQuantity, setLocalQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const { addToCart, cartItems, updateQuantity } = useCart()
  const router = useRouter()

  // Construct variant key consistently
  const variantKey = `${productId}-${selectedSize}-${selectedColor.name}`

  // Check if item is in cart using the unique variant key
  const cartItem = cartItems.find(item => item.variantKey === variantKey)
  const isInCart = !!cartItem

  const handleAddToCart = async () => {
    if (!selectedSize || isAdding) return

    setIsAdding(true)
    try {
      addToCart({
        id: variantId || productId,
        title: productTitle,
        price: productPrice,
        image: productImage,
        size: selectedSize,
        color: selectedColor.name,
        quantity: localQuantity,
        variantKey: variantKey,
      })

      // Reset local quantity after adding
      setLocalQuantity(1)

      // Call success callback if provided
      if (onAddSuccess) {
        onAddSuccess()
      }
    } catch (error) {
      console.error('Failed to add to cart:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to add item to cart: ${errorMessage}`)
    } finally {
      setIsAdding(false)
    }
  }

  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity < 1) {
      // Don't remove from cart here, just stop decreasing or maybe show a delete prompt?
      // For now, let's allow going to 0 to remove like standard cart behavior 
      // OR matching user requirement "User intent = I want more / less... +/ - only change local quantity"
      // Wait, in State 2 (In Cart): "+ -> increases cart quantity, - -> decreases cart quantity"
      updateQuantity(variantKey, newQuantity)
    } else {
      updateQuantity(variantKey, newQuantity)
    }
  }

  const isMobile = variant === 'mobile'

  if (isInCart) {
    return (
      <div className={`${className} flex items-center gap-3`}>
        <div className={`flex items-center bg-black text-white rounded-lg ${isMobile ? 'h-14 flex-1' : 'h-12 flex-1'}`}>
          <button
            onClick={() => handleUpdateQuantity(cartItem.quantity - 1)}
            className="h-full px-4 flex items-center justify-center hover:bg-gray-800 transition-colors rounded-l-lg"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="flex-1 flex flex-col items-center justify-center leading-none">
            <span className="font-bold text-lg">{cartItem.quantity}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-80">In Cart</span>
          </div>
          <button
            onClick={() => handleUpdateQuantity(cartItem.quantity + 1)}
            className="h-full px-4 flex items-center justify-center hover:bg-gray-800 transition-colors rounded-r-lg"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Optional Go to Cart Button for Mobile if needed, 
            but strictly following "Replace Add to Cart with [ - ] 2 [ + ]" 
            and keeping the UI clean. The instruction says "AND optionally: Go to Cart CTA".
            Since FloatingBottomBar handles "Go to Cart" on mobile, we might keep this simple.
            But for Desktop, we might want a direct link or icon.
        */}
        {!isMobile && (
          <button
            onClick={() => router.push('/cart')}
            className="h-12 px-4 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm whitespace-nowrap flex-shrink-0"
            title="Go to Cart"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Go to Cart</span>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={`${className} flex gap-2`}>
      {/* Quantity Selector for State 1 (Optional, but requested in designs: [-] 1 [+] [ ADD TO CART ]) */}
      <div className={`flex items-center bg-gray-100 rounded-lg ${isMobile ? 'h-14 w-24' : 'h-12 w-28'}`}>
        <button
          onClick={() => setLocalQuantity(q => Math.max(1, q - 1))}
          disabled={!selectedSize || localQuantity <= 1}
          className="h-full px-2 flex items-center justify-center hover:bg-gray-200 transition-colors rounded-l-lg disabled:opacity-30"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="flex-1 text-center font-bold text-gray-900">{localQuantity}</span>
        <button
          onClick={() => setLocalQuantity(q => q + 1)}
          disabled={!selectedSize}
          className="h-full px-2 flex items-center justify-center hover:bg-gray-200 transition-colors rounded-r-lg disabled:opacity-30"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <button
        onClick={handleAddToCart}
        disabled={!selectedSize || isAdding}
        className={`flex-1 ${isMobile
          ? 'h-14 rounded-lg font-medium text-base'
          : 'h-12 px-4 rounded-lg font-medium text-sm'
          } bg-black hover:bg-gray-800 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
      >
        {isAdding ? (
          'Adding...'
        ) : (
          <>
            <span>ADD TO CART</span>
            {localQuantity > 1 && <span className="text-white/60 text-xs">({localQuantity})</span>}
          </>
        )}
      </button>
    </div>
  )
}
