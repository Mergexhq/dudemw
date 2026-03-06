'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Trash2, Minus, Plus, Heart } from 'lucide-react'
import { useCart } from '@/domains/cart'
import { motion } from 'framer-motion'

interface CartItemProps {
  item: {
    id: string
    title: string
    price: number
    image: string
    size?: string
    color?: string
    quantity: number
    stock?: number
    variantKey: string
    isFBT?: boolean
  }
  variant?: 'mobile' | 'desktop'
}

const PLACEHOLDER_IMAGE = '/images/placeholder-product.jpg'

export default function CartItem({ item, variant = 'desktop' }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart()
  const [isRemoving, setIsRemoving] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Safety check - ensure item has required properties
  if (!item || !item.id || !item.variantKey) {
    return null
  }

  // Get safe image URL
  const imageUrl = (!item.image || item.image === '' || imageError)
    ? PLACEHOLDER_IMAGE
    : item.image

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return
    setIsUpdating(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    updateQuantity(item.variantKey, newQuantity)
    setIsUpdating(false)
  }

  const handleRemove = async () => {
    setIsRemoving(true)
    await new Promise(resolve => setTimeout(resolve, 300))
    removeFromCart(item.variantKey)
  }

  const isMobile = variant === 'mobile'
  const isOOS = item.stock !== undefined && item.stock <= 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isRemoving ? 0 : 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border-2 ${isOOS ? 'border-red-100 bg-red-50/10' : 'border-gray-200 hover:border-gray-300'} transition-all`}
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <div
          className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 relative`}
        >
          <Image
            src={imageUrl}
            fill
            sizes={isMobile ? '96px' : '128px'}
            alt={item.title || 'Product'}
            className={`object-cover ${isOOS ? 'grayscale opacity-60' : ''}`}
            onError={() => setImageError(true)}
          />
          {isOOS && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <span className="text-[10px] font-bold text-white uppercase tracking-wider text-center px-1">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className={`flex-1 min-w-0 ${isMobile ? 'flex flex-col justify-between' : ''}`}>
          <div className="flex justify-between gap-4 mb-2">
            <div className="flex-1">
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-heading font-bold text-gray-900 leading-tight ${isOOS ? 'text-gray-500' : ''}`}>
                {item.title}
              </h3>

              {/* Mobile Price under title */}
              {isMobile && (
                <div className="mt-1 mb-2">
                  <p className="text-lg font-bold text-gray-900">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                {item.size && (
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">Size: {item.size}</span>
                )}
                {item.color && (
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">Color: {item.color}</span>
                )}
                {item.isFBT && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                    Combo Item
                  </span>
                )}
              </div>
              {isOOS && (
                <div className="mt-2 text-[10px] font-bold text-red-600 bg-red-50 py-1 px-2 rounded border border-red-100 w-fit uppercase tracking-wider">
                  Out of Stock
                </div>
              )}
            </div>

            {/* Desktop Price */}
            {!isMobile && (
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
                {item.quantity > 1 && (
                  <p className="text-sm text-gray-500">
                    ₹{item.price.toLocaleString('en-IN')} each
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={`flex ${isMobile ? 'flex-col gap-3 mt-3' : 'items-center justify-between mt-4'} w-full`}>
            {/* Quantity Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1 || isOOS}
                className="w-8 h-8 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className={`w-12 h-8 flex items-center justify-center font-bold ${isOOS ? 'text-gray-400' : 'text-gray-900'}`}>
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                ) : (
                  item.quantity
                )}
              </div>

              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating || isOOS}
                className="w-8 h-8 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Remove & Wishlist */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className={`flex items-center gap-1.5 ${isMobile ? 'text-red-500 hover:text-red-700' : 'text-gray-500 hover:text-red-600'} text-sm font-medium transition-all uppercase tracking-wider text-[11px]`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>

              <div className="w-[1px] h-3 bg-gray-300"></div>

              <button className="flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-sm font-medium transition-all uppercase tracking-wider text-[11px]">
                <Heart className="w-3.5 h-3.5" />
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
