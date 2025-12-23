'use client'

import { useState } from 'react'
import { useCart } from '@/domains/cart'
import CartItem from './CartItem'
import OrderSummary from './OrderSummary'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import RelatedProducts from './RelatedProducts'

export default function MobileCartView() {
  const { cartItems, totalPrice } = useCart()
  const [showSummary, setShowSummary] = useState(false)
  const router = useRouter()

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
            <CartItem key={item.variantKey} item={item} variant="mobile" />
          ))}
        </div>

        {/* Continue Shopping */}
        <Link
          href="/products"
          className="inline-block bg-gray-100 text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors mb-6"
        >
          ← Continue Shopping
        </Link>

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
              <OrderSummary isSticky={false} />
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
            <p className="text-2xl font-heading font-bold text-gray-900">
              ₹{totalPrice.toLocaleString('en-IN')}
            </p>
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
