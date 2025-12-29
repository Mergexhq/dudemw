'use client'

import dynamic from 'next/dynamic'

const CartPageComponent = dynamic(() => import('@/domains/cart').then(mod => ({ default: mod.CartPage })), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function Cart() {
  return <CartPageComponent />
}
