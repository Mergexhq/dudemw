'use client'

import { ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  isOutOfStock?: boolean
}

export default function FloatingBottomBar({
  isVisible,
  selectedColor,
  price,
  onBuyNow,
  isMobile = false,
  isOutOfStock,
}: FloatingBottomBarProps) {
  const { cartItems, totalPrice, appliedCampaign, campaignDiscount, finalTotal, nearestCampaign } = useCart()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fully self-managed visibility: show whenever cart has items (after hydration)
  const shouldShow = isMounted && cartItems.length > 0

  // Get unique variants (max 3 for display)
  const displayItems = cartItems.slice(0, 3).map((item: CartItem) => ({
    image: item.image || '/images/placeholder-product.jpg',
    title: item.title || 'Product',
    quantity: item.quantity
  }))

  // Show discounted price when campaign is applied, otherwise show total
  const displayTotal = appliedCampaign ? finalTotal : totalPrice
  const hasDiscount = appliedCampaign && campaignDiscount > 0

  // Check if customer can buy from floating bar
  // If product is OOS, we only allow "Go to Cart"
  const canBuyFromFloatingBar = cartItems.length <= 1 && !isOutOfStock

  const content = (
    <div
      className={`fixed bottom-4 z-50 transition-all duration-300 ease-out 
        ${shouldShow ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95 pointer-events-none'}
        ${isMobile ? 'left-4 right-4 lg:hidden' : 'left-1/2 -translate-x-1/2 hidden lg:block'}`}
    >
      <div
        className={`rounded-2xl bg-gradient-to-br from-red-600 via-red-500 to-red-700 shadow-2xl overflow-hidden ${isMobile ? '' : 'w-[900px]'
          }`}
        style={{
          boxShadow: '0 10px 40px rgba(220, 38, 38, 0.4), 0 20px 60px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

        <div className={`relative px-4 ${isMobile ? 'py-2' : 'py-2'} flex items-center gap-3`}>
          {displayItems.length > 0 && (
            <div
              className="relative flex items-center justify-center flex-shrink-0 transition-all duration-500"
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
                    className="relative transition-all duration-500"
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
                    {item.quantity > 1 && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center border border-white">
                        <span className="text-white text-[10px] font-bold">{item.quantity}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex-1 min-w-0 transition-all duration-300">
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

            <p className="text-[9px] text-white font-medium uppercase tracking-wide mb-0.5">
              Total Price {displayItems.length > 0 && `(${displayItems.length} ${displayItems.length === 1 ? 'item' : 'items'})`}
            </p>

            <div className="flex items-baseline gap-1.5">
              <p className={`text-lg font-bold ${hasDiscount ? 'text-yellow-400' : 'text-white'}`}>
                ₹{displayTotal.toLocaleString('en-IN')}
              </p>
              {hasDiscount && (
                <p className="text-[11px] text-white line-through">
                  ₹{totalPrice.toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={canBuyFromFloatingBar ? onBuyNow : () => window.location.href = '/cart'}
            className={`bg-white text-red-600 ${isMobile ? 'px-4 py-2' : 'px-4 py-1.5'} rounded-lg font-bold text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-lg hover:shadow-xl transition-all active:scale-95 flex-shrink-0 whitespace-nowrap`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span className="leading-none">{canBuyFromFloatingBar ? 'Buy Now' : 'Go to Cart'}</span>
          </button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  )

  if (!isMounted) return null

  return createPortal(content, document.body)
}
