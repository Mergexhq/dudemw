'use client'

import { useCart } from '@/domains/cart'
import { useAuth } from '@/domains/auth/context'
import CheckoutForm from './CheckoutFormV2'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PaymentSettings } from '@/lib/types/settings'

interface CheckoutPageProps {
  preloadedPaymentSettings?: PaymentSettings | null
}

export default function CheckoutPage({ preloadedPaymentSettings }: CheckoutPageProps) {
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

  // Reduce auth timeout: 5s is sufficient for India mobile p95
  useEffect(() => {
    if (!isAuthLoading) return
    const timer = setTimeout(() => {
      setAuthTimedOut(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [isAuthLoading])

  // Reduce cart grace from 1.5s → 600ms — fast enough to prevent flash without blocking
  useEffect(() => {
    if (isCartLoading) return
    console.log('[Checkout:Page] Cart loaded — items:', cartItems.length, 'starting 1.5s grace period')
    const timer = setTimeout(() => setCartGracePassed(true), 600)
    return () => clearTimeout(timer)
  }, [isCartLoading])

  useEffect(() => {
    console.log('[Checkout:Page] State update — authLoading:', isAuthLoading, 'authTimedOut:', authTimedOut, 'cartLoading:', isCartLoading, 'cartGrace:', cartGracePassed, 'items:', cartItems.length)
  }, [isAuthLoading, authTimedOut, isCartLoading, cartGracePassed, cartItems.length])

  const isActuallyLoading = isCartLoading || !cartGracePassed

  if (isActuallyLoading) {
    return <CheckoutSkeleton />
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

  return (
    <div className="min-h-screen bg-white pt-8 pb-[calc(8rem+env(safe-area-inset-bottom))] lg:pb-8 overflow-x-hidden">
      <div className="w-full container mx-auto px-4">
        <CheckoutForm preloadedPaymentSettings={preloadedPaymentSettings} />
      </div>
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-white pt-8 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="h-6 w-44 bg-gray-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={i >= 4 ? 'md:col-span-2' : ''}>
                    <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-1" />
                    <div className="h-10 w-full bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-16 w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>
          <div className="lg:col-span-1">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-16 h-20 bg-gray-200 rounded animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
                    <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
