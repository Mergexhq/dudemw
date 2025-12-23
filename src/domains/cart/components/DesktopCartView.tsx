'use client'

import { useCart } from '@/domains/cart'
import CartItem from './CartItem'
import OrderSummary from './OrderSummary'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import RelatedProducts from './RelatedProducts'

export default function DesktopCartView() {
  const { cartItems } = useCart()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-black font-medium">Cart</span>
        </div>

        {/* Page Title */}
        <h1 className="text-4xl font-heading font-bold text-gray-900 mb-8">
          Your Cart
        </h1>

        {/* Two Column Layout */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Cart Items (70%) */}
          <div className="col-span-8">
            <div className="space-y-4 mb-6">
              {cartItems.map((item) => (
                <CartItem key={item.variantKey} item={item} variant="desktop" />
              ))}
            </div>

            {/* Continue Shopping */}
            <Link
              href="/products"
              className="inline-block bg-gray-100 text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>

          {/* Right Column - Order Summary (30%) */}
          <div className="col-span-4">
            <OrderSummary isSticky={true} />
          </div>
        </div>

        {/* Upsell Section */}
        <RelatedProducts />
      </div>
    </div>
  )
}
