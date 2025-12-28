'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { useCart, type CartItem } from '@/domains/cart'

interface FloatingBottomBarProps {
  isVisible: boolean
  selectedColor?: {
    name: string
    hex: string
    image: string
  }
  price: number
  onBuyNow: () => void
  isMobile?: boolean
}

export default function FloatingBottomBar({
  isVisible,
  selectedColor,
  price,
  onBuyNow,
  isMobile = false,
}: FloatingBottomBarProps) {
  const { cartItems, totalPrice } = useCart()

  // Get unique variants (max 3 for display)
  const displayItems = cartItems.slice(0, 3).map((item: CartItem) => ({
    image: item.image || '/images/placeholder-product.jpg',
    title: item.title || 'Product',
    quantity: item.quantity
  }))

  // Calculate total price (main product + cart items)
  const displayPrice = price + totalPrice

  // Check if customer can buy from floating bar
  const canBuyFromFloatingBar = cartItems.length <= 1
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed bottom-4 z-50 ${isMobile ? 'left-4 right-4' : 'left-1/2 -translate-x-1/2'}`}
        >
          <div
            className={`rounded-2xl bg-gradient-to-br from-red-600 via-red-500 to-red-700 shadow-2xl overflow-hidden ${isMobile ? '' : 'w-[900px]'
              }`}
            style={{
              boxShadow: '0 10px 40px rgba(220, 38, 38, 0.4), 0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
          >
            {/* 3D Effect Layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

            <div className={`relative px-4 ${isMobile ? 'py-3' : 'py-2.5'} flex items-center gap-4`}>
              {/* Stacked Product Thumbnails */}
              {displayItems.length > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative flex items-center justify-center flex-shrink-0"
                  style={{
                    width: displayItems.length === 1
                      ? (isMobile ? '56px' : '64px')
                      : displayItems.length === 2
                        ? (isMobile ? '80px' : '96px')
                        : (isMobile ? '104px' : '128px'),
                    height: isMobile ? '56px' : '64px'
                  }}
                >
                  {displayItems.map((item, index) => {
                    const totalItems = displayItems.length
                    const centerIndex = (totalItems - 1) / 2
                    const offset = (index - centerIndex) * (isMobile ? 24 : 32)

                    return (
                      <div
                        key={index}
                        className="relative"
                        style={{
                          position: 'absolute',
                          left: `calc(50% + ${offset}px)`,
                          transform: `translateX(-50%) rotate(${(index - centerIndex) * (isMobile ? 8 : 6)}deg)`,
                          zIndex: index === Math.floor(centerIndex) ? 10 : 10 - Math.abs(index - centerIndex),
                        }}
                      >
                        <div className={`${isMobile ? 'w-14 h-14' : 'w-16 h-16'} ${isMobile ? 'rounded-lg' : 'rounded-2xl'} overflow-hidden bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-lg`}>
                          <Image
                            src={item.image}
                            fill
                            alt={item.title || 'Product'}
                            className="object-cover"
                          />
                        </div>
                        {/* Quantity Badge */}
                        {item.quantity > 1 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full flex items-center justify-center border-2 border-white">
                            <span className="text-white text-xs font-bold">{item.quantity}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </motion.div>
              )}

              {/* Price */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex-1"
              >
                <p className={`${isMobile ? 'text-xs' : 'text-[10px]'} text-white/80 font-medium uppercase tracking-wide`}>
                  Total Price {displayItems.length > 0 && `(${displayItems.length} ${displayItems.length === 1 ? 'item' : 'items'})`}
                </p>
                <p className={`${isMobile ? 'text-2xl' : 'text-xl'} font-bold text-white`}>
                  ₹{displayPrice.toLocaleString('en-IN')}
                </p>
              </motion.div>

              {/* Buy Now Button */}
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={canBuyFromFloatingBar ? onBuyNow : () => window.location.href = '/cart'}
                className={`bg-white text-red-600 ${isMobile ? 'px-6 py-3' : 'px-5 py-2'} rounded-xl font-bold text-sm uppercase tracking-wide flex items-center gap-2 shadow-lg hover:shadow-xl transition-all`}
              >
                <ShoppingCart className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'}`} />
                {canBuyFromFloatingBar ? 'Buy Now' : 'Go to Cart'}
              </motion.button>
            </div>

            {/* Bottom Glow Effect */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
