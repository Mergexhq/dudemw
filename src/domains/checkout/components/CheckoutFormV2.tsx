'use client'

import { useState, useEffect } from 'react'
import * as React from 'react'
import { useCart } from '@/domains/cart'
import { useAuth } from '@/domains/auth/context'
import { useToast } from '@/lib/layout/feedback/ToastContext'
import { useRouter } from 'next/navigation'
import { useCheckoutSound } from '@/domains/checkout'
import { supabase } from '@/lib/supabase/client'

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
        productId: item.productId || item.id,
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
    setIsProcessing(true)

    try {
      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const shippingAmount = shippingCost ? shippingCost.amount / 100 : 0
      const taxAmount = taxBreakdown ? taxBreakdown.totalTax : 0
      const total = subtotal + shippingAmount + taxAmount

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user?.id || null,
          guest_id: !user ? `guest_${Date.now()}` : null,
          email: formData.email,
          phone: formData.phone,
          status: 'pending',
          payment_status: 'pending',
          order_number: `ORD${Date.now()}`,
          subtotal_amount: subtotal,
          shipping_amount: shippingAmount,
          tax_amount: taxAmount,
          total_amount: total,
          shipping_address: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            postalCode: formData.postalCode,
            phone: formData.phone
          },
          shipping_method: shippingCost?.optionName || 'ST Courier',
          tax_details: taxBreakdown
        })
        .select()
        .single()

      if (orderError || !order) {
        throw new Error('Failed to create order')
      }

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        variant_id: item.id,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity
      }))

      await supabase.from('order_items').insert(orderItems)

      // Create Razorpay order
      const paymentResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          amount: total,
          customerDetails: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone
          }
        })
      })

      const paymentData = await paymentResponse.json()
      if (!paymentData.success) {
        throw new Error('Failed to initiate payment')
      }

      // Open Razorpay checkout
      const options = {
        key: paymentData.keyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Dude Menswear',
        description: `Order #${order.order_number}`,
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
                orderId: order.id
              })
            })

            const verifyData = await verifyResponse.json()
            if (verifyData.success) {
              playCheckoutSound()
              clearCart()
              showToast('Order placed successfully!', 'success')
              router.push(`/order/confirmed/${order.id}`)
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

    } catch (error: any) {
      console.error('Checkout error:', error)
      showToast(error.message || 'Checkout failed. Please try again.', 'error')
      setIsProcessing(false)
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shippingAmount = shippingCost ? shippingCost.amount / 100 : 0
  const taxAmount = taxBreakdown ? taxBreakdown.totalTax : 0
  const total = subtotal + shippingAmount + taxAmount

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
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
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>₹{shippingAmount.toFixed(2)}</span>
              </div>
              {taxBreakdown && (
                <>
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
                </>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total:</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button type="button" onClick={() => setStep('shipping')} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300">
                Back
              </button>
              <button type="button" onClick={handlePlaceOrder} disabled={isProcessing} className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400">
                {isProcessing ? 'Processing...' : 'Pay with Razorpay'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
