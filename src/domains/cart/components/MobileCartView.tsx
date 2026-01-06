'use client'

import { useState, Suspense } from 'react'
import { useCart } from '@/domains/cart'
import CartItem from './CartItem'
import OrderSummary from './OrderSummary'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

// Dynamically import RelatedProducts to prevent it from blocking render
const RelatedProducts = dynamic(() => import('./RelatedProducts'), {
  ssr: false,
  loading: () => <div className="mt-12 h-48 bg-gray-100 rounded-lg animate-pulse" />
})

export default function MobileCartView() {
  const { cartItems = [], totalPrice = 0, appliedCampaign, campaignDiscount = 0, finalTotal = 0 } = useCart()
  const [showSummary, setShowSummary] = useState(false)
  const router = useRouter()

  // Use finalTotal when campaign is applied, otherwise use totalPrice
  const displayTotal = appliedCampaign ? finalTotal : totalPrice

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <div className="px-4 py-6">
        {/* Page Title */}
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-6">
          Your Cart
        </h1>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cartItems.map((item) => (
            item && item.variantKey ? (
              <CartItem key={item.variantKey} item={item} variant="mobile" />
            ) : null
          ))}
        </div>

        {/* Continue Shopping */}
        <Link
          href="/products"
          className="inline-block bg-gray-100 text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors mb-6"
        >
          ← Continue Shopping
        </Link>

        {/* Campaign Discount Banner - Mobile */}
        {appliedCampaign && campaignDiscount > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <div>
                  <div className="font-semibold text-green-800 text-sm">{appliedCampaign.name || 'Discount Applied'}</div>
                  <div className="text-xs text-green-600">
                    {appliedCampaign.discountType === 'flat'
                      ? `Flat ₹${appliedCampaign.discount || 0} discount applied!`
                      : `${appliedCampaign.discount || 0}% discount applied!`
                    }
                  </div>
                </div>
              </div>
              <div className="text-base font-bold text-green-700">
                -₹{(campaignDiscount || 0).toFixed(0)}
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Order Summary */}
        <div className="mb-6">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="w-full bg-white border-2 border-gray-200 rounded-xl p-4 flex items-center justify-between"
          >
            <span className="font-heading font-bold text-gray-900">
              Order Summary
            </span>
            {showSummary ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>

          {showSummary && (
            <div className="mt-4">
              <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
                <OrderSummary isSticky={false} />
              </Suspense>
            </div>
          )}
        </div>

        {/* Upsell Section */}
        <RelatedProducts />
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg z-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-gray-600">Total Amount</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-heading font-bold ${appliedCampaign ? 'text-green-600' : 'text-gray-900'}`}>
                ₹{(displayTotal || 0).toLocaleString('en-IN')}
              </p>
              {appliedCampaign && totalPrice > displayTotal && (
                <p className="text-sm text-gray-400 line-through">
                  ₹{(totalPrice || 0).toLocaleString('en-IN')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/checkout')}
            className="bg-black text-white px-8 py-4 rounded-lg font-bold hover:bg-gray-800 transition-all"
          >
            Checkout
          </button>
        </div>
        <p className="text-xs text-center text-gray-500">
          Shipping & taxes calculated at checkout
        </p>
      </div>
    </div>
  )
}

