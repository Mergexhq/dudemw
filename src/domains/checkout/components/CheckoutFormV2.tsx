'use client'

import { useState, useEffect } from 'react'
import * as React from 'react'
import { useCart } from '@/domains/cart'
import { useAuth } from '@/domains/auth/context'
import { useToast } from '@/lib/layout/feedback/ToastContext'
import { useRouter } from 'next/navigation'
import { useCheckoutSound } from '@/domains/checkout'
import { supabase } from '@/lib/supabase/client'
import { getGuestId } from '@/lib/guest-session'
import { getOrCreateGuestCustomer, getOrCreateCustomerForUser } from '@/lib/actions/customer-domain'
import { createOrder, updateOrderStatusDirect } from '@/lib/actions/orders'
import { PaymentSettings } from '@/lib/types/settings'
import OrderSummary from './OrderSummary'
import PromoCode from './PromoCode'
import { ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutFormV2() {
  const { cartItems, clearCart } = useCart()
  const { user, isLoading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const playCheckoutSound = useCheckoutSound()

  const [step, setStep] = useState<'shipping' | 'review' | 'payment'>('shipping')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isLoadingShipping, setIsLoadingShipping] = useState(false)
  const [shippingCost, setShippingCost] = useState<any>(null)
  const [taxBreakdown, setTaxBreakdown] = useState<any>(null)
  const [coupon, setCoupon] = useState<{ code: string; amount: number } | null>(null)
  const [showMobileSummary, setShowMobileSummary] = useState(false)

  // Payment settings and method selection
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'razorpay' | null>(null)
  const [isLoadingPaymentSettings, setIsLoadingPaymentSettings] = useState(true)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
  })

  // Load user data
  useEffect(() => {
    if (user && !isLoading) {
      const fullName = user.name || ''
      setFormData(prev => ({
        ...prev,
        email: user.email || prev.email,
        firstName: fullName.split(' ')[0] || prev.firstName,
        lastName: fullName.split(' ').slice(1).join(' ') || prev.lastName,
        phone: user.phone || prev.phone,
      }))
    }
  }, [user, isLoading])

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  // Fetch payment settings
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      try {
        const response = await fetch('/api/settings/payment-settings')
        const result = await response.json()
        if (result.success && result.data) {
          setPaymentSettings(result.data)
          // Set default payment method based on what's enabled
          if (result.data.cod_enabled && !result.data.razorpay_enabled) {
            setSelectedPaymentMethod('cod')
          } else if (result.data.razorpay_enabled && !result.data.cod_enabled) {
            setSelectedPaymentMethod('razorpay')
          } else if (result.data.cod_enabled) {
            // If both enabled, default to COD
            setSelectedPaymentMethod('cod')
          }
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error)
      } finally {
        setIsLoadingPaymentSettings(false)
      }
    }

    fetchPaymentSettings()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // Calculate shipping when postal code and state are entered
  useEffect(() => {
    const calculateShipping = async () => {
      if (formData.postalCode.length === 6 && formData.state) {
        setIsLoadingShipping(true)
        try {
          const response = await fetch('/api/shipping/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              postalCode: formData.postalCode,
              state: formData.state,
              totalQuantity: cartItems.reduce((sum, item) => sum + item.quantity, 0)
            })
          })

          const data = await response.json()
          if (data.success) {
            setShippingCost(data)

            // Also calculate tax
            await calculateTax()
          }
        } catch (error) {
          console.error('Shipping calculation failed:', error)
        } finally {
          setIsLoadingShipping(false)
        }
      }
    }

    calculateShipping()
  }, [formData.postalCode, formData.state, cartItems])

  const calculateTax = async () => {
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
          customerState: formData.state,
          isPriceInclusive: false
        })
      })

      const data = await response.json()
      if (data.success) {
        setTaxBreakdown(data.taxBreakdown)
      }
    } catch (error) {
      console.error('Tax calculation failed:', error)
    }
  }

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!shippingCost) {
      showToast('Please enter a valid postal code to calculate shipping', 'error')
      return
    }

    setStep('review')
  }

  const handlePlaceOrder = async () => {
    if (!selectedPaymentMethod) {
      showToast('Please select a payment method', 'error')
      return
    }

    // Check COD max amount if applicable
    if (selectedPaymentMethod === 'cod' && paymentSettings?.cod_max_amount && paymentSettings.cod_max_amount > 0) {
      if (total > paymentSettings.cod_max_amount) {
        showToast(`COD is not available for orders above ₹${paymentSettings.cod_max_amount}. Please use online payment.`, 'error')
        return
      }
    }

    setIsProcessing(true)

    try {
      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const shippingAmount = shippingCost ? shippingCost.amount / 100 : 0
      const taxAmount = taxBreakdown ? taxBreakdown.totalTax : 0
      // Calculate total with discount
      const discountAmount = coupon ? coupon.amount : 0
      const totalAmount = Math.max(0, subtotal + shippingAmount + taxAmount - discountAmount)

      // Create or get customer
      let customerId: string | null = null
      if (user) {
        const customerResult = await getOrCreateCustomerForUser(user.id, {
          email: user.email || formData.email,
          phone: formData.phone,
          first_name: formData.firstName,
          last_name: formData.lastName,
        })
        if (customerResult.success && customerResult.data) {
          customerId = customerResult.data.id
        } else {
          console.error('Customer creation failed:', customerResult.error)
        }
      } else {
        const guestResult = await getOrCreateGuestCustomer(formData.email, {
          phone: formData.phone,
          first_name: formData.firstName,
          last_name: formData.lastName,
        })
        if (guestResult.success && guestResult.data) {
          customerId = guestResult.data.id
        } else {
          console.error('Guest customer creation failed:', guestResult.error)
        }
      }

      const guestSessionId = !user ? getGuestId() : null

      // Create order using server action (bypasses RLS for guests)
      const orderResult = await createOrder({
        userId: user?.id || null,
        guestId: guestSessionId,
        customerId: customerId,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        orderStatus: 'pending',
        paymentStatus: selectedPaymentMethod === 'cod' ? 'pending_cod' : 'pending',
        paymentMethod: selectedPaymentMethod,
        subtotalAmount: subtotal,
        shippingAmount: shippingAmount,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          phone: formData.phone
        },
        shippingMethod: shippingCost?.optionName || 'ST Courier',
        taxDetails: taxBreakdown,
        couponCode: coupon?.code, // Pass coupon code to server action
        items: cartItems.map(item => ({
          variantId: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      })

      if (!orderResult.success || !orderResult.orderId) {
        console.error('Order creation error:', orderResult.error)
        throw new Error('Failed to create order')
      }

      const orderId = orderResult.orderId

      // Handle payment based on selected method
      if (selectedPaymentMethod === 'cod') {
        // COD - Order is complete, mark as confirmed
        await updateOrderStatusDirect(orderId, 'confirmed')

        playCheckoutSound()
        clearCart()
        showToast('Order placed successfully! Pay on delivery.', 'success')
        router.push(`/order/confirmed/${orderId}`)
      } else {
        // Razorpay - Initiate payment
        const paymentResponse = await fetch('/api/payments/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: orderId,
            amount: totalAmount,
            customerDetails: {
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              phone: formData.phone
            }
          })
        })

        const paymentData = await paymentResponse.json()
        if (!paymentData.success) {
          throw new Error(paymentData.error || 'Failed to initiate payment')
        }

        // Open Razorpay checkout
        const options = {
          key: paymentData.keyId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          name: 'Dude Menswear',
          description: `Order #${orderId}`,
          order_id: paymentData.razorpayOrderId,
          handler: async function (response: any) {
            try {
              // Verify payment
              const verifyResponse = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderId: orderId
                })
              })

              const verifyData = await verifyResponse.json()
              if (verifyData.success) {
                playCheckoutSound()
                clearCart()
                showToast('Order placed successfully!', 'success')
                router.push(`/order/confirmed/${orderId}`)
              } else {
                showToast('Payment verification failed', 'error')
              }
            } catch (error) {
              showToast('Payment verification failed', 'error')
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: '#000000'
          }
        }

        const razorpay = new window.Razorpay(options)
        razorpay.open()

        razorpay.on('payment.failed', function (response: any) {
          showToast('Payment failed. Please try again.', 'error')
          setIsProcessing(false)
        })
      }

    } catch (error: any) {
      console.error('Checkout error:', error)
      showToast(error.message || 'Checkout failed. Please try again.', 'error')
      setIsProcessing(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shippingAmount = shippingCost ? shippingCost.amount / 100 : 0
  const taxAmount = taxBreakdown ? taxBreakdown.totalTax : 0
  const discountAmount = coupon ? coupon.amount : 0
  const total = Math.max(0, subtotal + shippingAmount + taxAmount - discountAmount)

  // Check if COD is available for this order amount
  const isCodAvailable = paymentSettings?.cod_enabled &&
    (!paymentSettings.cod_max_amount || paymentSettings.cod_max_amount === 0 || total <= paymentSettings.cod_max_amount)

  if (isLoading || isLoadingPaymentSettings) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8">
      {/* Mobile Order Summary Toggle */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setShowMobileSummary(!showMobileSummary)}
          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-black font-medium">
            <span className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {showMobileSummary ? 'Hide' : 'Show'} Order Summary
            </span>
            <span className="text-gray-500">
              {showMobileSummary ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </span>
          </div>
          <span className="font-bold text-lg">₹{total.toLocaleString('en-IN')}</span>
        </button>

        {showMobileSummary && (
          <div className="mt-4">
            <OrderSummary
              shippingOverride={shippingCost ? shippingCost.amount / 100 : undefined}
              taxOverride={taxBreakdown ? taxBreakdown.totalTax : undefined}
              totalOverride={total}
              taxDetails={taxBreakdown}
              showShipping={!!shippingCost}
              discountAmount={discountAmount}
              couponCode={coupon?.code}
              onCouponApplied={(discount) => setCoupon(discount)}
            />
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        {/* Progress Steps */}
        <div className="flex items-center mb-8">
          <div className={`flex items-center ${step !== 'shipping' ? 'text-green-600' : 'text-black'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step !== 'shipping' ? 'bg-green-600 text-white' : 'bg-black text-white'}`}>
              {step !== 'shipping' ? '✓' : '1'}
            </div>
            <span className="ml-2 font-medium">Shipping</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          <div className={`flex items-center ${step === 'review' || step === 'payment' ? 'text-black' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'review' || step === 'payment' ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'}`}>
              2
            </div>
            <span className="ml-2 font-medium">Review & Pay</span>
          </div>
        </div>

        {/* Shipping Form */}
        {step === 'shipping' && (
          <form onSubmit={handleShippingSubmit} className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Shipping Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <select name="state" value={formData.state} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black">
                    <option value="">Select State</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    {/* Add more states as needed */}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} required pattern="[0-9]{6}" maxLength={6} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
              </div>

              {/* Shipping Cost Display */}
              {shippingCost && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">📦 Delivery Option</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{shippingCost.optionName}</div>
                      <div className="text-sm text-green-700">{shippingCost.description}</div>
                      <div className="text-xs text-green-600 mt-1">Est. delivery: {shippingCost.estimatedDelivery}</div>
                    </div>
                    <div className="text-xl font-bold text-green-800">₹{shippingCost.amount / 100}</div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={isProcessing || !shippingCost} className="w-full mt-6 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400">
                {isProcessing ? 'Processing...' : shippingCost ? 'Continue to Review' : 'Enter postal code to continue'}
              </button>
            </div>
          </form>
        )}

        {/* Review & Payment */}
        {step === 'review' && (
          <div className="space-y-6">
            {/* Payment Method Selection */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>

              <div className="space-y-3">
                {/* COD Option */}
                {paymentSettings?.cod_enabled && (
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === 'cod'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                      } ${!isCodAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={selectedPaymentMethod === 'cod'}
                      onChange={() => setSelectedPaymentMethod('cod')}
                      disabled={!isCodAvailable}
                      className="w-5 h-5 text-black"
                    />
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">💵 Cash on Delivery</span>
                        {!isCodAvailable && paymentSettings.cod_max_amount && (
                          <span className="text-xs text-red-500">Not available for orders above ₹{paymentSettings.cod_max_amount}</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">Pay when your order is delivered</p>
                    </div>
                  </label>
                )}

                {/* Razorpay Option */}
                {paymentSettings?.razorpay_enabled && (
                  <label
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPaymentMethod === 'razorpay'
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={selectedPaymentMethod === 'razorpay'}
                      onChange={() => setSelectedPaymentMethod('razorpay')}
                      className="w-5 h-5 text-black"
                    />
                    <div className="ml-4 flex-1">
                      <span className="font-semibold">💳 Pay Online</span>
                      <p className="text-sm text-gray-500 mt-1">UPI, Cards, Net Banking, Wallets</p>
                    </div>
                  </label>
                )}

                {/* No payment methods enabled */}
                {!paymentSettings?.cod_enabled && !paymentSettings?.razorpay_enabled && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                    No payment methods are currently available. Please contact support.
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setStep('shipping')} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300">
                Back
              </button>
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isProcessing || !selectedPaymentMethod}
                className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
              >
                {isProcessing ? 'Processing...' : selectedPaymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay Now'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Order Summary - Desktop Only */}
      <div className="hidden lg:block lg:col-span-1">
        <div className="sticky top-8 space-y-6">
          <OrderSummary
            shippingOverride={shippingCost ? shippingCost.amount / 100 : undefined}
            taxOverride={taxBreakdown ? taxBreakdown.totalTax : undefined}
            totalOverride={total}
            taxDetails={taxBreakdown}
            showShipping={!!shippingCost}
            discountAmount={discountAmount}
            couponCode={coupon?.code}
            onCouponApplied={(discount) => setCoupon(discount)}
          />
        </div>
      </div>
    </div>
  )
}
