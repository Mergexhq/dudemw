'use client'

import { useCart } from '@/domains/cart'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import CartItem from './CartItem'
import { ShoppingBag, ArrowRight } from 'lucide-react'

// Trigger HMR rebuild to clear Turbopack caching error
export default function MobileCartView() {
  const { cartItems = [], totalPrice = 0, appliedCampaign, campaignDiscount = 0, finalTotal = 0, isLoadingStock } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const router = useRouter()

  const isAnyItemOOS = cartItems.some(item => (item.stock !== undefined && item.stock <= 0))

  const handleCheckout = async () => {
    if (isAnyItemOOS || cartItems.length === 0 || isLoadingStock) return
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
          onClick={() => router.push('/shop')}
          className="w-full bg-black text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          Start Shopping
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    )
  }

  return (
    <div className="lg:hidden flex flex-col h-full bg-gray-50 pb-[100px]">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {cartItems.map((item) => (
          <CartItem key={item.variantKey} item={item} />
        ))}
      </div>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-40 lg:hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Total Amount</p>
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-gray-900">₹{displayTotal.toLocaleString()}</span>
                {appliedCampaign && (
                  <span className="text-xs text-gray-400 line-through">₹{totalPrice.toLocaleString()}</span>
                )}
              </div>
              {appliedCampaign && (
                <span className="text-xs font-medium text-green-600 mt-1">
                  You saved ₹{(totalPrice - displayTotal).toLocaleString()} on this order
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 border-t bg-white safe-bottom shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <button
            onClick={handleCheckout}
            disabled={isCheckingOut || isLoadingStock || isAnyItemOOS || cartItems.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${isAnyItemOOS || cartItems.length === 0 || isLoadingStock
              ? 'bg-gray-400 cursor-not-allowed opacity-70 text-white'
              : 'bg-black text-white active:scale-95'
              }`}
          >
            {isCheckingOut ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : isLoadingStock ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Refreshing Stock...
              </>
            ) : isAnyItemOOS ? (
              'Remove OOS Items'
            ) : (
              'Checkout Now'
            )}
          </button>
          {isAnyItemOOS && (
            <p className="text-[10px] text-red-500 text-center mt-2 font-medium">
              Remove out of stock items to proceed with checkout.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
