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

        {/* Added Cart Summary Section header before the items end to give it space */}
        <div className="pt-4 border-t mt-6">
          <h2 className="text-sm font-bold text-gray-900 mb-2">Cart Summary</h2>
        </div>
      </div>

      {/* Floating Bottom Navigation */}
      <div
        className="fixed left-0 right-0 bg-white border-t z-50 lg:hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)] px-4 py-4 pb-safe"
        style={{ bottom: '56px' }}
      >
        <div className="flex flex-row items-center justify-between gap-4">
          <div className="flex flex-col flex-[0.45]">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Amount</p>
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-xl font-bold text-gray-900">₹{displayTotal.toLocaleString()}</span>
              {appliedCampaign && (
                <span className="text-xs text-gray-400 line-through">₹{totalPrice.toLocaleString()}</span>
              )}
            </div>
            {appliedCampaign && (
              <span className="text-[10px] font-medium text-green-600 mt-0.5 max-w-full truncate">
                Saved ₹{(totalPrice - displayTotal).toLocaleString()}
              </span>
            )}
          </div>
          <div className="flex-[0.55]">
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut || isLoadingStock || isAnyItemOOS || cartItems.length === 0}
              className={`w-full h-12 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${isAnyItemOOS || cartItems.length === 0 || isLoadingStock
                ? 'bg-gray-400 cursor-not-allowed opacity-70 text-white'
                : 'bg-black text-white hover:bg-gray-800 active:scale-95'
                }`}
            >
              {isCheckingOut ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Wait...
                </>
              ) : isLoadingStock ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Wait...
                </>
              ) : isAnyItemOOS ? (
                'Remove OOS'
              ) : (
                'Checkout'
              )}
            </button>
          </div>
        </div>
        {isAnyItemOOS && (
          <p className="text-[10px] text-red-500 text-center mt-2 font-medium">
            Remove out of stock items to proceed.
          </p>
        )}
      </div>
    </div>
  )
}
