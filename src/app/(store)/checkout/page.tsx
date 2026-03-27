import { Suspense } from 'react'
import { getCheckoutData } from '@/lib/actions/checkout/get-checkout-data'
import CheckoutShell from '@/domains/checkout/components/CheckoutShell'

/**
 * Checkout page — Server Component.
 * Pre-fetches payment settings on the server so the client never has to wait.
 * Shows a skeleton loader via Suspense while the shell hydrates.
 */
export default async function Checkout() {
  const { paymentSettings } = await getCheckoutData()

  return (
    <Suspense fallback={<CheckoutSkeleton />}>
      <CheckoutShell paymentSettings={paymentSettings} />
    </Suspense>
  )
}

function CheckoutSkeleton() {
  return (
    <div className="min-h-screen bg-white pt-8 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column — form skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping section */}
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

            {/* Payment section */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
              <div className="h-6 w-36 bg-gray-200 rounded animate-pulse" />
              <div className="h-16 w-full bg-gray-100 rounded-lg animate-pulse" />
            </div>

            {/* CTA */}
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
          </div>

          {/* Right column — order summary skeleton */}
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
