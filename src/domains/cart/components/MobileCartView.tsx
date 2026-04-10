'use client'

import { useCart } from '@/domains/cart'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import CartItem from './CartItem'
import { ShoppingBag, ArrowRight } from 'lucide-react'

// Trigger HMR rebuild to clear Turbopack caching error
export default function MobileCartView() {
  const { cartItems = [], totalPrice = 0, appliedCampaign, campaignDiscount = 0, finalTotal = 0, isLoadingStock, isEvaluatingCampaign } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // Reset scroll to top so the cart never opens in a mid-scroll state
    if (scrollRef.current) scrollRef.current.scrollTop = 0
    window.scrollTo(0, 0)
  }, [])

  const isAnyItemOOS = cartItems.some(item => (item.stock !== undefined && item.stock <= 0))

  const handleCheckout = async () => {
    if (isAnyItemOOS || cartItems.length === 0 || isLoadingStock || isEvaluatingCampaign) return
    setIsCheckingOut(true)
    router.push('/checkout')
  }

  // Total in cart = subtotal only (shipping is calculated at checkout based on location)
  const displayTotal = appliedCampaign ? finalTotal : totalPrice

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Looks like you haven't added anything to your cart yet.</p>
        <button
          onClick={() => router.push('/products')}
          className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          Start Shopping
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  const floatingBar = (
    <div
      className="fixed left-0 right-0 z-[100] lg:hidden shadow-[0_-12px_30px_rgba(0,0,0,0.15)] overflow-hidden"
      style={{ bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Savings message line - Full Width Fixed Top */}
      {campaignDiscount > 0 && (
        <div className="bg-green-600 text-white text-[10px] font-bold py-2 text-center w-full uppercase tracking-widest border-b border-green-500/20">
          You saved ₹{campaignDiscount.toLocaleString()} on this order
        </div>
      )}

      <div className="bg-white px-6 py-5">
        <div className="flex flex-row items-center justify-between gap-6 h-12">
          <div className="flex flex-col flex-[0.4] justify-center">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold leading-none mb-1">Total Amount</p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl font-bold text-gray-900 leading-none">₹{displayTotal.toLocaleString()}</span>
              <span className="text-xs text-gray-400 line-through leading-none">₹{totalPrice.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex-[0.6]">
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || isLoadingStock || isEvaluatingCampaign || isAnyItemOOS || cartItems.length === 0}
              className={`w-full h-12 px-6 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-md ${isAnyItemOOS || cartItems.length === 0 || isLoadingStock || isEvaluatingCampaign
                ? 'bg-gray-400 cursor-not-allowed opacity-70 text-white'
                : 'bg-black text-white hover:bg-gray-800 active:scale-95'
                }`}
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : isLoadingStock ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Syncing...
                </>
              ) : isEvaluatingCampaign ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Applying...
                </>
              ) : isAnyItemOOS ? (
                'Check Stock'
              ) : (
                'Checkout Now'
              )}
            </button>
          </div>
        </div>
        {isAnyItemOOS && (
          <p className="text-[10px] text-red-500 text-center mt-2 font-medium">
            Some items are out of stock. Remove them to proceed.
          </p>
        )}
      </div>
    </div>
  )

  return (
    <div className="lg:hidden flex flex-col h-full bg-gray-50 pb-[100px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-48">
        {cartItems.map((item) => (
          <CartItem key={item.variantKey} item={item} variant="mobile" />
        ))}
      </div>

      {mounted && createPortal(floatingBar, document.body)}
    </div>
  )
}
