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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isRemoving ? 0 : 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`bg-white ${isMobile ? 'p-4' : 'p-6'} rounded-xl border-2 border-gray-200 hover:border-gray-300 transition-all`}
    >
      <div className="flex gap-4">
        {/* Product Image */}
        <div
          className={`${isMobile ? 'w-24 h-24' : 'w-32 h-32'} flex-shrink-0 rounded-lg overflow-hidden bg-gray-100`}
          style={{ position: 'relative' }}
        >
          <Image
            src={imageUrl}
            fill
            sizes={isMobile ? '96px' : '128px'}
            alt={item.title || 'Product'}
            className="object-cover"
            onError={() => setImageError(true)}
          />
        </div>

        {/* Product Details */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-4 mb-2">
            <div className="flex-1">
              <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-heading font-bold text-gray-900 mb-1`}>
                {item.title}
              </h3>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                {item.size && (
                  <span className="bg-gray-100 px-2 py-1 rounded">Size: {item.size}</span>
                )}
                {item.color && (
                  <span className="bg-gray-100 px-2 py-1 rounded">Color: {item.color}</span>
                )}
                {item.isFBT && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                    Combo Item
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            <div className="text-right">
              <p className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-gray-900`}>
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </p>
              {item.quantity > 1 && (
                <p className="text-sm text-gray-500">
                  ₹{item.price.toLocaleString('en-IN')} each
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4">
            {/* Quantity Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(item.quantity - 1)}
                disabled={isUpdating || item.quantity <= 1}
                className="w-8 h-8 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>

              <div className="w-12 h-8 flex items-center justify-center font-bold text-gray-900">
                {isUpdating ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                ) : (
                  item.quantity
                )}
              </div>

              <button
                onClick={() => handleQuantityChange(item.quantity + 1)}
                disabled={isUpdating}
                className="w-8 h-8 rounded-lg border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Remove & Wishlist */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm font-medium transition-all"
              >
                <Trash2 className="w-4 h-4" />
                {!isMobile && 'Remove'}
              </button>

              <button className="flex items-center gap-1 text-gray-600 hover:text-red-600 text-sm font-medium transition-all">
                <Heart className="w-4 h-4" />
                {!isMobile && 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
