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
import { ThemedStateSelect } from '@/components/ui/state-select'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'

// Razorpay types
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutFormV2() {
  const { cartItems, clearCart, appliedCampaign, campaignDiscount } = useCart()
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
  const [savedAddresses, setSavedAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')

  // Payment settings and method selection
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cod' | 'razorpay' | null>(null)
  const [isLoadingPaymentSettings, setIsLoadingPaymentSettings] = useState(true)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    address2: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
  })

  // Load user data and saved addresses
  useEffect(() => {
    const loadUserData = async () => {
      if (user && !isLoading) {
        const fullName = user.name || ''
        setFormData(prev => ({
          ...prev,
          email: user.email || prev.email,
          firstName: fullName.split(' ')[0] || prev.firstName,
          lastName: fullName.split(' ').slice(1).join(' ') || prev.lastName,
          phone: user.phone || prev.phone,
        }))

        // Fetch saved addresses
        try {
          const { data: addresses, error } = await supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })

          if (!error && addresses) {
            setSavedAddresses(addresses)

            // Auto-select default address if exists
            const defaultAddress = addresses.find(addr => addr.is_default)
            if (defaultAddress) {
              setSelectedAddressId(defaultAddress.id)
              autofillAddress(defaultAddress)
            }
          }
        } catch (error) {
          console.error('Error loading addresses:', error)
        }
      }
    }

    loadUserData()
  }, [user, isLoading])

  const autofillAddress = (address: any) => {
    setFormData(prev => ({
      ...prev,
      address: address.address_line1 || '',
      address2: address.address_line2 || '',
      city: address.city || '',
      state: address.state || '',
      postalCode: address.pincode || '',
      phone: address.phone || prev.phone,
    }))
  }

  const formatAddressLabel = (address: any) => {
    const name = address.name || 'Home';
    const street = address.address_line1 || '';
    const city = address.city || '';
    const pincode = address.pincode || '';

    // Truncate street if too long
    const truncatedStreet = street.length > 30 ? street.substring(0, 30) + '...' : street;

    return `${name} - ${truncatedStreet}, ${city} ${pincode}`;
  };

  const handleAddressChange = (addressId: string) => {
    setSelectedAddressId(addressId)
    if (addressId === 'new') {
      // Clear form for new address
      setFormData(prev => ({
        ...prev,
        address: '',
        address2: '',
        city: '',
        state: '',
        postalCode: '',
      }))
    } else {
      const selectedAddress = savedAddresses.find(addr => addr.id === addressId)
      if (selectedAddress) {
        autofillAddress(selectedAddress)
      }
    }
  }

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
            // Only COD enabled
            setSelectedPaymentMethod('cod')
          } else if (result.data.razorpay_enabled && !result.data.cod_enabled) {
            // Only Razorpay enabled
            setSelectedPaymentMethod('razorpay')
          } else if (result.data.cod_enabled && result.data.razorpay_enabled) {
            // Both enabled, default to COD
            setSelectedPaymentMethod('cod')
          } else {
            // Neither enabled, clear selection
            setSelectedPaymentMethod(null)
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

  // Clear selected payment method if it becomes unavailable
  useEffect(() => {
    if (paymentSettings && selectedPaymentMethod) {
      if (selectedPaymentMethod === 'cod' && !paymentSettings.cod_enabled) {
        // COD was selected but is now disabled
        if (paymentSettings.razorpay_enabled) {
          setSelectedPaymentMethod('razorpay')
        } else {
          setSelectedPaymentMethod(null)
        }
      } else if (selectedPaymentMethod === 'razorpay' && !paymentSettings.razorpay_enabled) {
        // Razorpay was selected but is now disabled
        if (paymentSettings.cod_enabled) {
          setSelectedPaymentMethod('cod')
        } else {
          setSelectedPaymentMethod(null)
        }
      }
    }
  }, [paymentSettings, selectedPaymentMethod])

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

  const validateRequiredFields = () => {
    const requiredFields = {
      phone: 'Phone number',
      firstName: 'First name',
      address: 'Address',
      city: 'City',
      state: 'State',
      postalCode: 'PIN code'
    }

    const missingFields: string[] = []

    for (const [field, label] of Object.entries(requiredFields)) {
      if (!formData[field as keyof typeof formData]?.trim()) {
        missingFields.push(label)
      }
    }

    // Validate PIN code format
    if (formData.postalCode && !/^[0-9]{6}$/.test(formData.postalCode)) {
      missingFields.push('Valid 6-digit PIN code')
    }

    return {
      isValid: missingFields.length === 0,
      missingFields
    }
  }

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Custom validation for required fields only
    const validation = validateRequiredFields()
    if (!validation.isValid) {
      showToast(`Please fill in: ${validation.missingFields.join(', ')}`, 'error')
      return
    }

    if (!shippingCost) {
      showToast('Please enter a valid postal code to calculate shipping', 'error')
      return
    }

    setStep('review')
  }

  const handlePlaceOrder = async () => {
    // Validate required fields before processing payment
    const validation = validateRequiredFields()
    if (!validation.isValid) {
      showToast(`Please fill in: ${validation.missingFields.join(', ')}`, 'error')
      return
    }

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
      // Calculate total with both campaign and coupon discounts
      const couponDiscountAmount = coupon ? coupon.amount : 0
      const totalDiscountAmount = campaignDiscount + couponDiscountAmount
      const totalAmount = Math.max(0, subtotal + shippingAmount + taxAmount - totalDiscountAmount)

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
        customerName: `${formData.firstName} ${formData.lastName || ''}`.trim(),
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
          address2: formData.address2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          phone: formData.phone
        },
        shippingMethod: shippingCost?.optionName || 'ST Courier',
        taxDetails: taxBreakdown,
        couponCode: coupon?.code, // Pass coupon code to server action
        campaignId: appliedCampaign?.id, // Pass campaign ID
        campaignDiscount: campaignDiscount, // Pass campaign discount amount
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
              name: `${formData.firstName} ${formData.lastName || ''}`.trim(),
              email: formData.email || '',
              phone: formData.phone
            }
          })
        })

        const paymentData = await paymentResponse.json()

        if (!paymentData.success) {
          console.error('Payment initiation failed:', paymentData);
          // Provide more helpful error messages
          let errorMessage = 'Failed to initiate payment. ';
          if (paymentData.debug?.configError) {
            errorMessage += 'Payment gateway configuration issue. Please contact support.';
          } else if (paymentData.error?.includes('Order not found')) {
            errorMessage += 'Order could not be found. Please try again.';
          } else {
            errorMessage += paymentData.error || 'Please try again or choose Cash on Delivery.';
          }
          throw new Error(errorMessage)
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
              console.log('[Checkout] Verification response:', verifyData);
              if (verifyData.success) {
                playCheckoutSound()
                clearCart()
                showToast('Order placed successfully!', 'success')
                router.push(`/order/confirmed/${orderId}`)
              } else {
                console.error('[Checkout] Verification failed:', verifyData);
                const errorMsg = verifyData.debug?.configError || verifyData.debug?.verificationError || verifyData.error || 'Payment verification failed';
                showToast(`Payment verification failed: ${errorMsg}`, 'error')
                setIsProcessing(false)
              }
            } catch (error) {
              console.error('[Checkout] Verification error:', error);
              showToast('Payment verification failed. Please contact support.', 'error')
              setIsProcessing(false)
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName || ''}`.trim(),
            email: formData.email || '',
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
  const couponDiscountAmount = coupon ? coupon.amount : 0
  const totalDiscountAmount = campaignDiscount + couponDiscountAmount
  const total = Math.max(0, subtotal + shippingAmount + taxAmount - totalDiscountAmount)

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
              discountAmount={couponDiscountAmount}
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

              {/* Saved Addresses Dropdown (for logged-in users) */}
              {user && savedAddresses.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📦 Use a saved address
                  </label>
                  <Select
                    value={selectedAddressId}
                    onValueChange={handleAddressChange}
                    placeholder="Select an address"
                  >
                    <SelectTrigger className="w-full bg-white border-gray-300">
                      <SelectValue placeholder="Select an address" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Enter new address</SelectItem>
                      {savedAddresses.map((address) => (
                        <SelectItem key={address.id} value={address.id}>
                          {formatAddressLabel(address)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name (Optional)</label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleInputChange} placeholder="Street address, P.O. box, company name, c/o" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Apartment, suite, etc. (Optional)</label>
                  <input type="text" name="address2" value={formData.address2} onChange={handleInputChange} placeholder="Apartment, suite, unit, building, floor, etc." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black appearance-none bg-white"
                  >
                    <option value="">Select State</option>
                    {/* Common Indian States */}
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="West Bengal">West Bengal</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code *</label>
                  <input type="text" name="postalCode" value={formData.postalCode} onChange={handleInputChange} pattern="[0-9]{6}" maxLength={6} placeholder="6-digit PIN code" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black" />
                </div>
              </div>



              <button
                type="button"
                onClick={handleShippingSubmit}
                disabled={isProcessing || !shippingCost}
                className="w-full mt-6 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
              >
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
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                      <span>⚠️</span>
                      <span>No Payment Methods Available</span>
                    </div>
                    <p className="text-red-700 text-sm">
                      Payment methods are currently disabled. Please contact our support team to complete your order.
                    </p>
                    <div className="mt-3 text-sm text-red-600">
                      <p>📞 Support: +91-XXXXXXXXXX</p>
                      <p>📧 Email: support@dudemw.com</p>
                    </div>
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
                disabled={isProcessing || !selectedPaymentMethod || (!paymentSettings?.cod_enabled && !paymentSettings?.razorpay_enabled)}
                className="flex-1 bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
              >
                {isProcessing ? 'Processing...' :
                  (!paymentSettings?.cod_enabled && !paymentSettings?.razorpay_enabled) ? 'No Payment Methods Available' :
                    selectedPaymentMethod === 'cod' ? 'Place Order (COD)' : 'Pay Now'}
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
            discountAmount={couponDiscountAmount}
            couponCode={coupon?.code}
            onCouponApplied={(discount) => setCoupon(discount)}
          />
        </div>
      </div>
    </div>
  )
}
