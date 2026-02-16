'use client'

import { useState } from 'react'
import { useCart, type CartItem } from '@/domains/cart'
import { Plus, ShoppingCart, Minus, ShoppingBag } from 'lucide-react'
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
  variantId?: string
  onAddSuccess?: () => void
  quantity?: number
  hideQuantitySelector?: boolean
  customLabel?: React.ReactNode
  customStyle?: string
  icon?: React.ReactNode
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
  onAddSuccess,
  quantity,
  hideQuantitySelector = false,
  customLabel,
  customStyle,
  icon
}: AddToCartButtonProps) {
  const [localQuantity, setLocalQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  const { addToCart, cartItems, updateQuantity } = useCart()
  const router = useRouter()

  // Use external quantity if provided, else local
  const currentQuantity = quantity !== undefined ? quantity : localQuantity

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
        quantity: currentQuantity,
        variantKey: variantKey,
      })

      // Reset local quantity after adding (only if using local)
      if (quantity === undefined) {
        setLocalQuantity(1)
      }

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
      updateQuantity(variantKey, newQuantity)
    } else {
      updateQuantity(variantKey, newQuantity)
    }
  }

  const isMobile = variant === 'mobile'

  // If hidden quantity selector, just render the button
  if (hideQuantitySelector) {
    // If in cart, we might still want to show the specific button unless we want to redirect to cart?
    // For this specific request, the buttons are "Add to Cart" and "Buy Now".
    // Even if in cart, "Add to Cart" usually just increments or opens cart? 
    // Let's stick to the requested UI: "Add to Cart" button.
    // If it's already in cart, maybe we change text to "Added" or allow adding more?
    // The requirement implies a specific UI. Let's render the button.

    return (
      <button
        onClick={handleAddToCart}
        disabled={!selectedSize || isAdding}
        className={`${className} flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${customStyle || (isMobile
          ? 'h-14 rounded-lg font-medium text-base bg-black text-white hover:bg-gray-800'
          : 'h-12 px-4 rounded-lg font-medium text-sm bg-black text-white hover:bg-gray-800')}`}
      >
        {isAdding ? (
          'Adding...'
        ) : (
          <>
            {icon || <ShoppingCart className="w-5 h-5" />}
            {customLabel || <span>ADD TO BAG</span>}
          </>
        )}
      </button>
    )
  }

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
      {/* Quantity Selector */}
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
