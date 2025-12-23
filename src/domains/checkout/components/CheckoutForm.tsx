'use client'

import { useState } from 'react'
import * as React from 'react'
import { useCart } from '@/domains/cart'
import { useAuth } from '@/domains/auth/context'
import { useToast } from '@/lib/layout/feedback/ToastContext'
import { useRouter } from 'next/navigation'
import { useCheckoutSound } from '@/domains/checkout'
import { getGuestId } from '@/lib/guest-session'
import { getOrCreateGuestCustomer, getOrCreateCustomerForUser } from '@/lib/actions/customer-domain'

export default function CheckoutForm() {
  const { cartItems, clearCart } = useCart()
  const { user, isLoading } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const playCheckoutSound = useCheckoutSound()

  const [step, setStep] = useState<'shipping' | 'payment'>('shipping')
  const [isProcessing, setIsProcessing] = useState(false)

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

  // Update form data when user loads
  React.useEffect(() => {
    if (user && !isLoading) {
      // User type uses name directly
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  // Store shipping info in state (we could enhance this with a server action later)
  const [shippingInfo, setShippingInfo] = useState<typeof formData | null>(null)

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      // Store shipping info
      setShippingInfo(formData)
      setStep('payment')
    } catch (error: unknown) {
      console.error('Failed to save shipping info:', error)
      showToast('Failed to save shipping information. Please try again.', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      if (!shippingInfo) {
        throw new Error('Shipping information is missing')
      }

      let customerId: string | null = null

      // Create or get customer record
      if (user) {
        // Logged in user - get or create registered customer
        const customerResult = await getOrCreateCustomerForUser(user.id, {
          email: user.email || shippingInfo.email,
          phone: shippingInfo.phone,
          first_name: shippingInfo.firstName,
          last_name: shippingInfo.lastName,
        })

        if (customerResult.success && customerResult.data) {
          customerId = customerResult.data.id
        }
      } else {
        // Guest user - get or create guest customer
        const guestResult = await getOrCreateGuestCustomer(shippingInfo.email, {
          phone: shippingInfo.phone,
          first_name: shippingInfo.firstName,
          last_name: shippingInfo.lastName,
        })

        if (guestResult.success && guestResult.data) {
          customerId = guestResult.data.id
        }
      }

      // Get guest session ID for tracking
      const guestSessionId = !user ? getGuestId() : null

      // Use server action to create order (bypasses RLS for guests)
      const { createOrder } = await import('@/lib/actions/orders')

      const orderResult = await createOrder({
        userId: user?.id || null,
        guestId: guestSessionId,
        customerId: customerId,
        customerEmail: shippingInfo.email,
        customerPhone: shippingInfo.phone,
        customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`.trim(),
        orderStatus: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'cod',
        subtotalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        shippingAmount: 0,
        taxAmount: 0,
        totalAmount: cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        shippingAddress: {
          firstName: shippingInfo.firstName,
          lastName: shippingInfo.lastName,
          address: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          postalCode: shippingInfo.postalCode,
          phone: shippingInfo.phone
        },
        shippingMethod: 'standard',
        items: cartItems.map(item => ({
          variantId: item.id,
          quantity: item.quantity,
          price: item.price
        }))
      })

      if (!orderResult.success || !orderResult.orderId) {
        throw new Error(orderResult.error || 'Failed to create order')
      }

      // Success
      playCheckoutSound()
      clearCart()
      showToast('Order placed successfully!', 'success')
      router.push(`/order/confirmed/${orderResult.orderId}`)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed'
      console.error('Failed to complete checkout:', error)
      showToast(errorMessage || 'Failed to complete checkout. Please try again.', 'error')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return <div>Loading cart...</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center ${step === 'shipping' ? 'text-black' : 'text-green-600'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'shipping' ? 'bg-black text-white' : 'bg-green-600 text-white'
            }`}>
            {step === 'payment' ? '✓' : '1'}
          </div>
          <span className="ml-2 font-medium">Shipping</span>
        </div>
        <div className="flex-1 h-px bg-gray-300 mx-4"></div>
        <div className={`flex items-center ${step === 'payment' ? 'text-black' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-black text-white' : 'bg-gray-300 text-gray-600'
            }`}>
            2
          </div>
          <span className="ml-2 font-medium">Payment</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 'shipping' && (
        <form onSubmit={handleShippingSubmit} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Shipping Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full mt-6 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
            >
              {isProcessing ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        </form>
      )}

      {step === 'payment' && (
        <form onSubmit={handlePaymentSubmit} className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Payment</h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-blue-800 text-sm">
                Payment processing is currently being set up. Orders will be processed manually.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={() => setStep('shipping')}
                className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300"
              >
                Back to Shipping
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
