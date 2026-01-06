'use client'

import { useState } from 'react'
import { useCart, type CartItem } from '@/domains/cart'
import { Plus, ShoppingCart } from 'lucide-react'
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
  const [quantity, setQuantity] = useState(1)
  const [isAdding, setIsAdding] = useState(false)
  // Cart sound removed - only plays on final purchase
  const { addToCart, cartItems } = useCart()
  const router = useRouter()

  // Check if item is in cart
  const isInCart = cartItems.some((item: CartItem) =>
    item.id === productId &&
    item.size === selectedSize &&
    item.color === selectedColor.name
  )

  const handleAddToCart = async () => {
    if (!selectedSize || isAdding) return

    setIsAdding(true)
    try {
      console.log('Adding to cart:', { productId, variantId, quantity, selectedSize, selectedColor: selectedColor.name })
      addToCart({
        id: variantId || productId, // Use variantId if available for checkout compatibility
        title: productTitle,
        price: productPrice,
        image: productImage,
        size: selectedSize,
        color: selectedColor.name,
        variantKey: `${productId}-${selectedSize}-${selectedColor.name}`,
      })
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

  const handleGoToCart = () => {
    router.push('/cart')
  }

  const isMobile = variant === 'mobile'

  if (isInCart) {
    return (
      <div className={`${className} flex gap-2`}>
        <button
          onClick={handleGoToCart}
          className={`flex-1 ${isMobile
            ? 'h-14 rounded-lg font-medium text-base'
            : 'py-3 px-4 rounded-lg font-medium text-sm'
            } bg-green-600 hover:bg-green-700 text-white transition-all flex items-center justify-center gap-2`}
        >
          <ShoppingCart className="w-5 h-5" />
          Go to Cart
        </button>
        <button
          onClick={() => setQuantity(q => q + 1)}
          className={`${isMobile ? 'w-14 h-14' : 'w-12 h-12'
            } bg-black hover:bg-gray-800 text-white rounded-lg transition-all flex items-center justify-center gap-1`}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-bold">{quantity}</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`${className} flex gap-2`}>
      <button
        onClick={handleAddToCart}
        disabled={!selectedSize || isAdding}
        className={`flex-1 ${isMobile
          ? 'h-14 rounded-lg font-medium text-base'
          : 'py-3 px-4 rounded-lg font-medium text-sm'
          } bg-black hover:bg-gray-800 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {isAdding
          ? 'Adding...'
          : isMobile
            ? (selectedSize ? 'Add to cart' : 'Select size')
            : 'ADD TO CART'
        }
      </button>
      {selectedSize && (
        <button
          onClick={() => setQuantity(q => q + 1)}
          className={`${isMobile ? 'w-14 h-14' : 'w-12 h-12'
            } bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg transition-all flex items-center justify-center gap-1`}
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-bold">{quantity}</span>
        </button>
      )}
    </div>
  )
}
