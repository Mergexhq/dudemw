'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Tag } from 'lucide-react'
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
  const { cartItems, totalPrice, appliedCampaign, campaignDiscount, finalTotal, nearestCampaign } = useCart()

  // Get unique variants (max 3 for display)
  const displayItems = cartItems.slice(0, 3).map((item: CartItem) => ({
    image: item.image || '/images/placeholder-product.jpg',
    title: item.title || 'Product',
    quantity: item.quantity
  }))

  // Show discounted price when campaign is applied, otherwise show total
  const displayPrice = appliedCampaign ? finalTotal : totalPrice
  const hasDiscount = appliedCampaign && campaignDiscount > 0

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

            <div className={`relative px-4 ${isMobile ? 'py-2' : 'py-2'} flex items-center gap-3`}>
              {/* Stacked Product Thumbnails */}
              {displayItems.length > 0 && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="relative flex items-center justify-center flex-shrink-0"
                  style={{
                    width: displayItems.length === 1
                      ? (isMobile ? '48px' : '56px')
                      : displayItems.length === 2
                        ? (isMobile ? '72px' : '84px')
                        : (isMobile ? '96px' : '112px'),
                    height: isMobile ? '48px' : '56px'
                  }}
                >
                  {displayItems.map((item, index) => {
                    const totalItems = displayItems.length
                    const centerIndex = (totalItems - 1) / 2
                    const offset = (index - centerIndex) * (isMobile ? 22 : 28)

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
                        <div className={`${isMobile ? 'w-12 h-12' : 'w-14 h-14'} ${isMobile ? 'rounded-lg' : 'rounded-xl'} overflow-hidden bg-white/10 backdrop-blur-sm border-2 border-white/20 shadow-lg`}>
                          <Image
                            src={item.image}
                            fill
                            alt={item.title || 'Product'}
                            className="object-cover"
                          />
                        </div>
                        {/* Quantity Badge */}
                        {item.quantity > 1 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center border border-white">
                            <span className="text-white text-[10px] font-bold">{item.quantity}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </motion.div>
              )}

              {/* Price & Discount Info - Reorganized in 3 lines */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex-1 min-w-0"
              >
                {/* Line 1: Discount Details (Campaign name and discount amount on same line) */}
                <div className="flex items-center gap-1 mb-0.5 whitespace-nowrap">
                  {hasDiscount ? (
                    <span className="text-[9px] text-yellow-400 font-semibold uppercase tracking-wide">
                      {appliedCampaign?.name || 'Discount'} -₹{campaignDiscount.toFixed(0)}
                    </span>
                  ) : nearestCampaign && nearestCampaign.itemsNeeded ? (
                    <span className="text-[9px] text-yellow-300/70 font-medium">
                      Add {nearestCampaign.itemsNeeded} more for {nearestCampaign.campaign?.name || 'discount'}
                    </span>
                  ) : (
                    <span className="text-[9px] text-white/60">No discount applied</span>
                  )}
                </div>

                {/* Line 2: Total Price with item count - White color */}
                <p className="text-[9px] text-white font-medium uppercase tracking-wide mb-0.5">
                  Total Price {displayItems.length > 0 && `(${displayItems.length} ${displayItems.length === 1 ? 'item' : 'items'})`}
                </p>

                {/* Line 3: Amount - Gold if discount, White otherwise */}
                <div className="flex items-baseline gap-1.5">
                  <p className={`text-lg font-bold ${hasDiscount ? 'text-yellow-400' : 'text-white'}`}>
                    ₹{displayPrice.toLocaleString('en-IN')}
                  </p>
                  {hasDiscount && (
                    <p className="text-[11px] text-white line-through">
                      ₹{totalPrice.toLocaleString('en-IN')}
                    </p>
                  )}
                </div>
              </motion.div>

              {/* Buy Now / Go to Cart Button - Smaller and one line */}
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={canBuyFromFloatingBar ? onBuyNow : () => window.location.href = '/cart'}
                className={`bg-white text-red-600 ${isMobile ? 'px-4 py-2' : 'px-4 py-1.5'} rounded-lg font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-lg hover:shadow-xl transition-all flex-shrink-0 whitespace-nowrap`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span className="leading-none">{canBuyFromFloatingBar ? 'Buy Now' : 'Go to Cart'}</span>
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
