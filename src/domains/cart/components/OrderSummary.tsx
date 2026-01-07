'use client'

import { useState, useEffect } from 'react'
import { useCart } from '@/domains/cart'
import { Shield, Truck, MapPin, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { TaxSettings } from '@/domains/admin/settings/tax/types'

interface TaxBreakdown {
  taxType: 'intra-state' | 'inter-state'
  cgst: number
  sgst: number
  igst: number
  totalTax: number
  taxableAmount: number
  gstRate?: number  // GST rate from API
  priceIncludesTax?: boolean  // Tax inclusive flag from API
}

interface OrderSummaryProps {
  isSticky?: boolean
}

export default function OrderSummary({ isSticky = true }: OrderSummaryProps) {
  const { cartItems, totalPrice, itemCount, appliedCampaign, campaignDiscount, finalTotal, nearestCampaign } = useCart()
  const router = useRouter()
  const [taxBreakdown, setTaxBreakdown] = useState<TaxBreakdown | null>(null)
  const [taxSettings, setTaxSettings] = useState<TaxSettings>({
    tax_enabled: true,
    price_includes_tax: true,
    default_gst_rate: 18,
    store_state: "Tamil Nadu",
    gstin: ""
  })
  const [isLoadingTax, setIsLoadingTax] = useState(false)
  const [deliveryDays, setDeliveryDays] = useState<{ min: number; max: number }>({ min: 3, max: 7 })

  const subtotal = totalPrice
  const discount = 0 // Coupons are applied at checkout only

  // Fetch delivery settings
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const response = await fetch('/api/settings/system-preferences')
        if (response.ok) {
          const result = await response.json()
          const data = result.data || result // Handle both wrapped and direct response
          if (data.min_delivery_days || data.max_delivery_days) {
            setDeliveryDays({
              min: data.min_delivery_days || 3,
              max: data.max_delivery_days || 7
            })
          }
        }
      } catch (error) {
        console.error('Error fetching delivery settings:', error)
      }
    }
    fetchDeliverySettings()
  }, [])

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
          quantity: item.quantity
          // gstRate is no longer passed - API will use default from DB
        }))

        const response = await fetch('/api/tax/calculate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            customerState: 'Tamil Nadu' // Default to store state for cart preview
            // isPriceInclusive is no longer passed - API will use setting from DB
          })
        })

        const data = await response.json()
        if (data.success) {
          setTaxBreakdown(data.taxBreakdown)
          if (data.taxSettings) {
            setTaxSettings(data.taxSettings)
          }
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
  // Calculate total based on whether prices include tax
  const grandTotal = taxSettings.price_includes_tax
    ? subtotal - discount  // If inclusive, subtotal already includes tax
    : subtotal - discount + taxAmount // If exclusive, add tax to subtotal

  const handleCheckout = () => {
    if (itemCount === 0) return
    router.push('/checkout')
  }

  // Get GST rate from taxBreakdown (comes from API) or fallback to taxSettings
  const gstRate = (taxBreakdown as any)?.gstRate || taxSettings.default_gst_rate
  const halfGstRate = gstRate / 2
  const isPriceInclusive = (taxBreakdown as any)?.priceIncludesTax ?? taxSettings.price_includes_tax

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

        {/* Applied Campaign - Enhanced Display */}
        {appliedCampaign && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 -mx-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎉</span>
                <div>
                  <div className="font-semibold text-green-800">{appliedCampaign.name}</div>
                  <div className="text-xs text-green-600">
                    {appliedCampaign.discountType === 'flat'
                      ? `Flat ₹${appliedCampaign.discount} discount applied!`
                      : `${appliedCampaign.discount}% discount applied!`
                    }
                  </div>
                </div>
              </div>
              <div className="text-lg font-bold text-green-700">
                -₹{campaignDiscount.toFixed(0)}
              </div>
            </div>
          </div>
        )}

        {/* Upsell Message - Enhanced */}
        {!appliedCampaign && nearestCampaign && nearestCampaign.itemsNeeded && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 -mx-2">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <div className="font-semibold text-blue-800">
                  Add {nearestCampaign.itemsNeeded} more item{nearestCampaign.itemsNeeded > 1 ? 's' : ''} to unlock a deal!
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {nearestCampaign.campaign?.name || 'Special discount available'}
                </div>
              </div>
            </div>
          </div>
        )}

        {!appliedCampaign && nearestCampaign && nearestCampaign.amountNeeded && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 -mx-2">
            <div className="flex items-start gap-2">
              <span className="text-xl">💡</span>
              <div>
                <div className="font-semibold text-blue-800">
                  Add ₹{nearestCampaign.amountNeeded.toFixed(0)} more to unlock a deal!
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {nearestCampaign.campaign?.name || 'Special discount available'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-3 flex justify-between font-bold text-lg">
          <span>Total</span>
          <div className="text-right">
            {appliedCampaign && (
              <div className="text-sm font-normal text-gray-400 line-through">
                ₹{subtotal.toFixed(0)}
              </div>
            )}
            <div className={appliedCampaign ? 'text-green-600' : ''}>
              ₹{(appliedCampaign ? finalTotal : grandTotal).toFixed(0)}
            </div>
          </div>
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
          <span>{deliveryDays.min}-{deliveryDays.max} Days Delivery</span>
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
        {itemCount === 0 ? 'Cart is Empty' : `Checkout (₹${(appliedCampaign ? finalTotal : grandTotal).toFixed(0)})`}
      </button>

      <p className="text-xs text-gray-500 text-center mt-3">
        {taxSettings.tax_enabled && (
          isPriceInclusive ? 'Inclusive of all taxes' : 'Exclusive of taxes (tax will be added)'
        )}
      </p>
    </div>
  )
}

