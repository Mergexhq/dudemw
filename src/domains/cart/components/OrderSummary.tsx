'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/domains/cart'
import { ArrowRight, Tag, Truck, ShieldCheck, Clock } from 'lucide-react'
import { getCartSettings } from '@/lib/actions/cart-settings'

interface OrderSummaryProps {
  isSticky?: boolean;
}

export default function OrderSummary({ isSticky = true }: OrderSummaryProps = {}) {
  const router = useRouter()
  const { cartItems, totalPrice, appliedCampaign, campaignDiscount, finalTotal, itemCount, isLoadingStock, isEvaluatingCampaign } = useCart()
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [deliveryRange, setDeliveryRange] = useState({ min: 2, max: 3 })

  // Fetch delivery days from DB (system_preferences)
  useEffect(() => {
    fetch('/api/settings/system-preferences')
      .then(r => r.json())
      .then(result => {
        const data = result?.data || result
        if (data?.min_delivery_days || data?.max_delivery_days) {
          setDeliveryRange({
            min: data.min_delivery_days ?? 2,
            max: data.max_delivery_days ?? 3,
          })
        }
      })
      .catch(() => { })
  }, [])

  const subtotal = totalPrice
  const discount = campaignDiscount
  const isAnyItemOOS = cartItems.some(item => (item.stock !== undefined && item.stock <= 0))

  // Total shown in cart = subtotal - discount (shipping calculated at checkout)
  const total = appliedCampaign
    ? finalTotal
    : subtotal - discount

  const handleCheckout = () => {
    if (itemCount === 0 || isAnyItemOOS || isLoadingStock || isEvaluatingCampaign) return
    setIsCheckingOut(true)
    router.push('/checkout')
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 ${isSticky ? 'sticky top-24' : ''}`}>
      <h2 className="text-xl font-bold mb-6">Order Summary</h2>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>

        <div className="pt-4 border-t border-gray-100 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-lg font-bold">Subtotal</span>
              <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
            </div>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                {discount > 0 && (
                  <span className="text-base text-gray-400 line-through">₹{subtotal.toLocaleString()}</span>
                )}
                <span className="text-2xl font-bold text-gray-900">₹{total.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <span className="text-sm font-medium text-green-600 mt-1">
                  You saved ₹{discount.toLocaleString()} on this order
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleCheckout}
          disabled={isCheckingOut || isLoadingStock || isEvaluatingCampaign || isAnyItemOOS || itemCount === 0}
          className={`w-full py-4 rounded-xl font-bold text-lg mb-4 transition-all flex items-center justify-center gap-2 ${isAnyItemOOS || itemCount === 0 || isLoadingStock || isEvaluatingCampaign
            ? 'bg-gray-400 cursor-not-allowed opacity-70 text-white'
            : 'bg-black hover:bg-gray-900 text-white active:scale-[0.98]'
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
          ) : isEvaluatingCampaign ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Applying Offers...
            </>
          ) : isAnyItemOOS ? (
            'Remove OOS Items'
          ) : (
            <>
              Checkout Now
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {isAnyItemOOS && (
          <p className="text-xs text-red-500 text-center font-medium">
            One or more items in your cart are out of stock. Please remove them to proceed.
          </p>
        )}

        {/* Benefits/Trust badges */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Secure Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Fast Delivery</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <Truck className="w-4 h-4" />
            <span className="text-xs font-medium">Delivering in {deliveryRange.min}-{deliveryRange.max} days</span>
          </div>
        </div>
      </div>
    </div>
  )
}
