'use client'

import { useState } from 'react'
import { useCart } from '@/domains/cart'
import { Tag, Shield, Truck, MapPin, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OrderSummaryProps {
  isSticky?: boolean
}

export default function OrderSummary({ isSticky = true }: OrderSummaryProps) {
  const { totalPrice, itemCount } = useCart()
  const router = useRouter()
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null)
  const [couponError, setCouponError] = useState('')

  const subtotal = totalPrice
  const discount = appliedCoupon ? 100 : 0
  const tax = Math.round(subtotal * 0.05) // 5% tax
  const grandTotal = subtotal - discount + tax

  const handleCouponApply = () => {
    setCouponError('')
    const validCoupons = ['SAVE10', 'WELCOME', 'FLAT50']

    if (validCoupons.includes(couponCode.toUpperCase())) {
      setAppliedCoupon(couponCode.toUpperCase())
      setCouponCode('')
    } else {
      setCouponError('Invalid coupon code')
    }
  }

  const handleCheckout = () => {
    if (itemCount === 0) return
    router.push('/checkout')
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${isSticky ? 'sticky top-20' : ''}`}>
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      {/* Coupon Section */}
      <div className="mb-4">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <button
            onClick={handleCouponApply}
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800"
          >
            Apply
          </button>
        </div>
        {couponError && (
          <p className="text-red-500 text-sm">{couponError}</p>
        )}
        {appliedCoupon && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <Tag className="w-4 h-4" />
            <span>{appliedCoupon} applied</span>
            <button
              onClick={() => setAppliedCoupon(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span>Subtotal ({itemCount} items)</span>
          <span>₹{subtotal.toFixed(0)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Coupon discount</span>
            <span>-₹{discount}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span>₹{tax}</span>
        </div>

        <div className="border-t pt-3 flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>₹{grandTotal.toFixed(0)}</span>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-2 gap-3 mb-6 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Secure Payment</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4" />
          <span>Fast Delivery</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          <span>Pan India</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>24/7 Support</span>
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={itemCount === 0}
        className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {itemCount === 0 ? 'Cart is Empty' : `Checkout (₹${grandTotal.toFixed(0)})`}
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        Inclusive of all taxes
      </p>
    </div>
  )
}
