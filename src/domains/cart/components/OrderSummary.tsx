'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/domains/cart'
import { ArrowRight, Tag, Truck, ShieldCheck, Clock } from 'lucide-react'
import { SettingsClientService } from '@/lib/services/settings-client'

export default function OrderSummary() {
  const router = useRouter()
  const { cartItems, totalPrice, appliedCampaign, campaignDiscount, finalTotal, itemCount } = useCart()
  const [taxAmount, setTaxAmount] = useState(0)
  const [deliverySettings, setDeliverySettings] = useState({
    minDays: 3,
    maxDays: 7,
    freeShippingThreshold: 500,
    shippingCost: 40
  })
  const [isLoadingTax, setIsLoadingTax] = useState(false)
  const [deliveryDays, setDeliveryDays] = useState<{ min: number; max: number }>({ min: 3, max: 7 })
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const subtotal = totalPrice
  const discount = campaignDiscount
  const isAnyItemOOS = cartItems.some(item => (item.stock !== undefined && item.stock <= 0))

  // Fetch delivery settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const result = await SettingsClientService.getStoreSettings()
        if (result.success && result.data) {
          setDeliveryDays({
            min: result.data.delivery?.minDays || 3,
            max: result.data.delivery?.maxDays || 7
          })
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }
    fetchSettings()
  }, [])

  // Calculate tax (dummy 18% for now)
  useEffect(() => {
    if (subtotal > 0) {
      setTaxAmount(Math.round(subtotal * 0.18))
    } else {
      setTaxAmount(0)
    }
  }, [subtotal])

  const total = appliedCampaign
    ? finalTotal + taxAmount
    : subtotal - discount + taxAmount

  const handleCheckout = () => {
    if (itemCount === 0 || isAnyItemOOS) return
    setIsCheckingOut(true)
    router.push('/checkout')
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
      <h2 className="text-xl font-bold mb-6">Order Summary</h2>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
          <span>₹{subtotal.toLocaleString()}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600 font-medium">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>Discount {appliedCampaign?.name && `(${appliedCampaign.name})`}</span>
            </div>
            <span>-₹{discount.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <div className="flex items-center gap-2">
            <span>Estimated GST (18%)</span>
          </div>
          <span>₹{taxAmount.toLocaleString()}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4" />
            <span>Shipping</span>
          </div>
          <span className="text-green-600 font-medium">FREE</span>
        </div>

        <div className="pt-4 border-t border-gray-100 pb-2">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-lg font-bold">Total Amount</span>
              <p className="text-xs text-gray-400 mt-1">Inclusive of all taxes</p>
            </div>
            <span className="text-2xl font-bold">₹{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleCheckout}
          disabled={isCheckingOut || isAnyItemOOS || itemCount === 0}
          className={`w-full py-4 rounded-xl font-bold text-lg mb-4 transition-all flex items-center justify-center gap-2 ${isAnyItemOOS || itemCount === 0
            ? 'bg-gray-400 cursor-not-allowed opacity-70 text-white'
            : 'bg-black hover:bg-gray-900 text-white active:scale-[0.98]'
            }`}
        >
          {isCheckingOut ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : isAnyItemOOS ? (
            'Remove OOS Items'
          ) : (
            <>
              Checkout
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
            <span className="text-xs font-medium">Delivering in {deliveryDays.min}-{deliveryDays.max} days</span>
          </div>
          <p className="text-[10px] text-gray-400">
            Estimated delivery to your pincode. Standard delivery charges may apply for remote locations.
          </p>
        </div>
      </div>
    </div>
  )
}
