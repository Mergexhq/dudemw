'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/domains/cart'
import { Shield, Truck, MapPin, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface OrderSummaryProps {
  isSticky?: boolean
}

export default function OrderSummary({ isSticky = true }: OrderSummaryProps) {
  const { cartItems, totalPrice, itemCount } = useCart()
  const router = useRouter()
  const [taxBreakdown, setTaxBreakdown] = useState<any>(null)
  const [isLoadingTax, setIsLoadingTax] = useState(false)

  const subtotal = totalPrice
  const discount = 0 // Coupons are applied at checkout only

  // Fetch tax calculation from backend
  useEffect(() => {
    const calculateTax = async () => {
      if (cartItems.length === 0) {
        setTaxBreakdown(null)
        return
      }

      setIsLoadingTax(true)
      try {
        const items = cartItems.map(item => ({
          id: item.id,
          productId: item.id,
          price: item.price,
          quantity: item.quantity,
          gstRate: 12 // Default 12% for clothing
        }))

        const response = await fetch('/api/tax/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            customerState: 'Tamil Nadu', // Default to store state for cart preview
            isPriceInclusive: true // Prices include tax
          })
        })

        const data = await response.json()
        if (data.success) {
          setTaxBreakdown(data.taxBreakdown)
        }
      } catch (error) {
        console.error('Tax calculation failed:', error)
      } finally {
        setIsLoadingTax(false)
      }
    }

    calculateTax()
  }, [cartItems])

  const taxAmount = taxBreakdown?.totalTax || 0
  const grandTotal = subtotal - discount

  const handleCheckout = () => {
    if (itemCount === 0) return
    router.push('/checkout')
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${isSticky ? 'sticky top-20' : ''}`}>
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      {/* Price Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span>Subtotal ({itemCount} items)</span>
          <span>₹{subtotal.toFixed(0)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-₹{discount}</span>
          </div>
        )}

        {/* Tax Breakdown */}
        {taxBreakdown && (
          <div className="space-y-1">
            {taxBreakdown.taxType === 'intra-state' ? (
              <>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>CGST (6%):</span>
                  <span>₹{taxBreakdown.cgst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>SGST (6%):</span>
                  <span>₹{taxBreakdown.sgst.toFixed(2)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-xs text-gray-600">
                <span>IGST (12%):</span>
                <span>₹{taxBreakdown.igst.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tax (Included)</span>
              <span>₹{taxAmount.toFixed(0)}</span>
            </div>
          </div>
        )}

        {isLoadingTax && !taxBreakdown && (
          <div className="flex justify-between text-sm text-gray-400">
            <span>Calculating tax...</span>
          </div>
        )}

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
