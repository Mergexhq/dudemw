'use client'

import { useCart } from '@/domains/cart'
import { useAuth } from '@/domains/auth/context'
import CheckoutForm from './CheckoutFormV2'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function CheckoutPage() {
  const { cartItems, isLoading: isCartLoading } = useCart()
  const { isLoading: isAuthLoading } = useAuth()

  // Safety timeout: if Clerk hasn't resolved in 12s (slow mobile 4G India),
  // stop waiting and render the checkout form as a guest.
  const [authTimedOut, setAuthTimedOut] = useState(false)

  // Extra grace period: wait at least 1.5s after cart loads before
  // showing "cart empty" — prevents flash-redirect on slow devices.
  const [cartGracePassed, setCartGracePassed] = useState(false)

  useEffect(() => {
    console.log('[Checkout:Page] Mount - isAuthLoading:', isAuthLoading, 'isCartLoading:', isCartLoading, 'cartItems:', cartItems.length)
  }, [])

  useEffect(() => {
    if (!isAuthLoading) return
    const timer = setTimeout(() => {
      console.warn('[Checkout:Page] Auth load timed out after 12s — proceeding as guest')
      setAuthTimedOut(true)
    }, 12000)
    return () => clearTimeout(timer)
  }, [isAuthLoading])

  // Start grace period as soon as cart stops loading
  useEffect(() => {
    if (isCartLoading) return
    console.log('[Checkout:Page] Cart loaded — items:', cartItems.length, 'starting 1.5s grace period')
    const timer = setTimeout(() => setCartGracePassed(true), 1500)
    return () => clearTimeout(timer)
  }, [isCartLoading])

  useEffect(() => {
    console.log('[Checkout:Page] State update — authLoading:', isAuthLoading, 'authTimedOut:', authTimedOut, 'cartLoading:', isCartLoading, 'cartGrace:', cartGracePassed, 'items:', cartItems.length)
  }, [isAuthLoading, authTimedOut, isCartLoading, cartGracePassed, cartItems.length])

  const isActuallyLoading = isCartLoading || (isAuthLoading && !authTimedOut) || !cartGracePassed

  if (isActuallyLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    )
  }

  // Only show empty cart AFTER grace period has passed — prevents flash-redirect
  if (cartItems.length === 0 && cartGracePassed) {
    console.warn('[Checkout:Page] Cart is empty after grace period — showing empty state')
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-6">
            Add some items to your cart before checking out.
          </p>
          <Link
            href="/products"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  console.log('[Checkout:Page] Rendering CheckoutForm with', cartItems.length, 'items')
  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        <CheckoutForm />
      </div>
    </div>
  )
}
