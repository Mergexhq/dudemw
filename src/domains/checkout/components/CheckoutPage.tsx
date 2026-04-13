'use client'

import { useCart } from '@/domains/cart'
import { useAuth } from '@/domains/auth/context'
import CheckoutForm from './CheckoutFormV2'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { PaymentSettings } from '@/lib/types/settings'

interface CheckoutPageProps {
  preloadedPaymentSettings?: PaymentSettings | null
}

export default function CheckoutPage({ preloadedPaymentSettings }: CheckoutPageProps) {
  const { cartItems, isLoading: isCartLoading } = useCart()
  const router = useRouter()
  const { isLoading: isAuthLoading } = useAuth()

  // Safety timeout: 5s is sufficient for India mobile p95
  const [authTimedOut, setAuthTimedOut] = useState(false)

  // Extra grace period after cart loads before acting on empty cart —
  // prevents flash-redirect on slow devices.
  const [cartGracePassed, setCartGracePassed] = useState(false)

  // Tracks whether the empty-cart redirect has already been triggered.
  const [redirecting, setRedirecting] = useState(false)

  // ─── ALL useEffects BEFORE any early return ───────────────────────────────
  // React's Rules of Hooks: hooks must always be called in the same order and
  // must never appear after a conditional early return.

  useEffect(() => {
    console.log('[Checkout:Page] Mount — isAuthLoading:', isAuthLoading, 'isCartLoading:', isCartLoading, 'cartItems:', cartItems.length)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isAuthLoading) return
    const timer = setTimeout(() => setAuthTimedOut(true), 5000)
    return () => clearTimeout(timer)
  }, [isAuthLoading])

  useEffect(() => {
    if (isCartLoading) return
    console.log('[Checkout:Page] Cart loaded — items:', cartItems.length, 'starting 600 ms grace period')
    const timer = setTimeout(() => setCartGracePassed(true), 600)
    return () => clearTimeout(timer)
  }, [isCartLoading])

  useEffect(() => {
    console.log('[Checkout:Page] State — authLoading:', isAuthLoading, 'authTimedOut:', authTimedOut, 'cartLoading:', isCartLoading, 'cartGrace:', cartGracePassed, 'items:', cartItems.length)
  }, [isAuthLoading, authTimedOut, isCartLoading, cartGracePassed, cartItems.length])

  // Empty-cart guard — intentionally placed here, before any early returns,
  // so it is ALWAYS called (satisfies Rules of Hooks).
  // It only fires the redirect after the grace period has elapsed, the cart
  // is confirmed empty, and the form hasn't already set order_navigating
  // (which signals the cart was cleared after a successful payment).
  useEffect(() => {
    if (!cartGracePassed) return          // still in grace period — wait
    if (cartItems.length > 0) return      // cart has items — nothing to do
    if (redirecting) return               // already redirecting — don't double-fire

    // If the Razorpay handler is about to navigate to /order/confirmed,
    // it sets this flag right before calling clearCart(). Honour it.
    try {
      if (sessionStorage.getItem('order_navigating')) {
        sessionStorage.removeItem('order_navigating')
        console.log('[Checkout:Page] Cart cleared by successful order — skipping empty-cart redirect')
        return
      }
    } catch {}

    console.warn('[Checkout:Page] Cart is empty after grace period — redirecting to homepage')
    setRedirecting(true)
    router.replace('/')
  }, [cartItems.length, cartGracePassed, redirecting, router])

  // ─── Early returns (AFTER all hooks) ─────────────────────────────────────

  const isActuallyLoading = isCartLoading || !cartGracePassed

  if (isActuallyLoading) {
    return <CheckoutSkeleton />
  }

  if (redirecting) {
    return null
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
