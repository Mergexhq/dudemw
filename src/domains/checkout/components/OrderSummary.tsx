'use client'

import { useCart, type CartItem } from '@/domains/cart'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import PromoCode from './PromoCode'

interface OrderSummaryProps {
  shippingOverride?: number
  taxOverride?: number
  totalOverride?: number
  taxDetails?: any
  showShipping?: boolean
  discountAmount?: number
  couponCode?: string
  onCouponApplied?: (discount: { code: string; amount: number } | null) => void
}

export default function OrderSummary({
  shippingOverride,
  taxOverride,
  totalOverride,
  taxDetails,
  showShipping = true,
  discountAmount = 0,
  couponCode,
  onCouponApplied
}: OrderSummaryProps) {
  const { cartItems, totalPrice, itemCount, appliedCampaign, campaignDiscount, finalTotal } = useCart()
  const [deliveryDays, setDeliveryDays] = useState<{ min: number; max: number }>({ min: 3, max: 7 })

  // Fetch delivery settings
  useEffect(() => {
    const fetchDeliverySettings = async () => {
      try {
        const response = await fetch('/api/settings/system-preferences')
        if (response.ok) {
          const result = await response.json()
          const data = result.data || result
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

  const formatPrice = (amount: number) => {
    return `₹${amount.toFixed(2)}`
  }

  const subtotal = totalPrice
  // Use override if provided, otherwise default logic
  const shippingCost = shippingOverride !== undefined ? shippingOverride : (subtotal >= 999 ? 0 : 99)
  const taxAmount = taxOverride || 0

  // Calculate total with campaign discount
  const totalAfterCampaign = appliedCampaign ? finalTotal : subtotal
  const finalOrderTotal = totalOverride !== undefined
    ? totalOverride
    : totalAfterCampaign + shippingCost + taxAmount - discountAmount

  return (
    <div className="bg-gray-50 rounded-lg p-4 lg:p-6">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      {/* Cart Items */}
      <div className="space-y-4 mb-6">
        {cartItems.map((item: CartItem) => (
          <div key={item.variantKey} className="flex gap-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-200">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium">{item.title}</h3>
              {(item.size || item.color) && (
                <p className="text-sm text-gray-600">
                  {item.size && `Size: ${item.size}`}
                  {item.size && item.color && ' • '}
                  {item.color && `Color: ${item.color}`}
                </p>
              )}
              <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
            </div>
            <div className="font-semibold">
              {formatPrice(item.price * item.quantity)}
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code Input */}
      {onCouponApplied && (
        <div className="mb-6">
          <PromoCode
            cartTotal={subtotal}
            onApplied={onCouponApplied}
          />
        </div>
      )}

      {/* Price Breakdown */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal ({itemCount} items)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {showShipping && (
          <>
            <div className="flex justify-between text-sm">
              <span>Shipping</span>
              <span className="text-green-600 font-medium">Free Delivery</span>
            </div>
            <div className="text-xs text-gray-500 -mt-1">
              Est. delivery: {new Date(Date.now() + deliveryDays.max * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </>
        )}

        {taxDetails && (taxDetails.totalTax > 0 || (taxDetails.gstRate || 0) > 0) && (
          <div className="space-y-1">
            {taxDetails.taxType === 'intra-state' ? (
              <>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>CGST ({taxDetails.gstRate ? taxDetails.gstRate / 2 : 9}%):</span>
                  <span>{formatPrice(taxDetails.cgst)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>SGST ({taxDetails.gstRate ? taxDetails.gstRate / 2 : 9}%):</span>
                  <span>{formatPrice(taxDetails.sgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-xs text-gray-600">
                <span>IGST ({taxDetails.gstRate || 18}%):</span>
                <span>{formatPrice(taxDetails.igst)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Tax {taxDetails.priceIncludesTax !== false ? '(Included)' : ''}</span>
              <span>{formatPrice(taxAmount)}</span>
            </div>
          </div>
        )}

        {/* Applied Campaign - Enhanced Display */}
        {appliedCampaign && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 -mx-2">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎉</span>
                <div>
                  <div className="font-semibold text-green-800 text-sm">{appliedCampaign.name}</div>
                  <div className="text-xs text-green-600">
                    {appliedCampaign.discountType === 'flat'
                      ? `Flat ₹${appliedCampaign.discount} discount applied!`
                      : `${appliedCampaign.discount}% discount applied!`
                    }
                  </div>
                </div>
              </div>
              <div className="text-sm font-bold text-green-700">
                -₹{campaignDiscount.toFixed(0)}
              </div>
            </div>
          </div>
        )}

        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount Added {couponCode ? `(${couponCode})` : ''}</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg border-t pt-2">
          <span>Total</span>
          <div className="text-right">
            {appliedCampaign && (
              <div className="text-sm font-normal text-gray-400 line-through">
                ₹{(subtotal + shippingCost + taxAmount - discountAmount).toFixed(0)}
              </div>
            )}
            <div className={appliedCampaign ? 'text-green-600' : 'text-red-600'}>
              {formatPrice(finalOrderTotal)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
