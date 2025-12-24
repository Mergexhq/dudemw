'use client'

import { ChevronRight, Search } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from '@/domains/product'
import WishlistSyncMessage from '@/domains/wishlist/components/WishlistSyncMessage'
import { useGuestProfile } from '../hooks/useGuestProfile'

export default function MobileGuestView() {
  const {
    trackingData,
    setTrackingData,
    handleTrackOrder,
    wishlistProducts,
    recentlyViewedProducts,
    wishlistCount,
  } = useGuestProfile(6)

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Unlock More Features Card */}
      <div className="mx-4 mt-6 mb-6 bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Unlock More Features
        </h2>
        <p className="text-gray-500 text-base mb-6 leading-relaxed">
          Save your details for faster checkout and see your full order history.
        </p>
        <Link
          href="/auth/login"
          className="block w-full bg-red-600 text-white py-4 rounded-2xl font-semibold text-lg text-center hover:bg-red-700 transition-colors"
        >
          Sign In / Create Account
        </Link>
      </div>

      {/* Track Recent Orders */}
      <div className="px-4 py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Track Recent Orders</h2>

        <form onSubmit={handleTrackOrder} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={trackingData.email}
              onChange={(e) => setTrackingData({ ...trackingData, email: e.target.value })}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 text-gray-900 placeholder-gray-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Order Number
            </label>
            <input
              type="text"
              value={trackingData.orderNumber}
              onChange={(e) => setTrackingData({ ...trackingData, orderNumber: e.target.value })}
              placeholder="Enter your order number"
              className="w-full px-4 py-3 bg-gray-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-600 text-gray-900 placeholder-gray-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Track Order
          </button>
        </form>
      </div>

      {/* Your Wishlist Section - Only show if there are items */}
      {wishlistProducts.length > 0 && (
        <div className="bg-white py-8">
          <div className="px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-3xl tracking-wider text-black">
                YOUR WISHLIST
              </h2>
              <Link href="/wishlist" className="text-red-600 font-semibold text-sm">
                See All
              </Link>
            </div>

            {/* Wishlist Products - Horizontal Scroll */}
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {wishlistProducts.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-[160px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            {/* Wishlist Sync Message */}
            <div className="mt-6">
              <WishlistSyncMessage />
            </div>

            {wishlistCount === 0 && (
              <p className="text-sm text-gray-500 mt-6 text-center">
                Sign in to save your wishlist across all devices.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recently Viewed Section - Only show if there are items */}
      {recentlyViewedProducts.length > 0 && (
        <div className="bg-gray-50 py-8">
          <div className="px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-3xl tracking-wider text-black">
                RECENTLY VIEWED
              </h2>
              <button className="text-red-600 font-semibold text-sm">
                See All
              </button>
            </div>

            {/* Recently Viewed Products - Horizontal Scroll */}
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {recentlyViewedProducts.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-[160px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Links */}
      <div className="px-4 pb-6 space-y-0 bg-white border-t border-gray-200 pt-6">
        <Link
          href="/faq"
          className="w-full py-4 flex items-center justify-between border-b border-gray-200"
        >
          <span className="text-lg text-gray-700">FAQ</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        <Link
          href="/shipping"
          className="w-full py-4 flex items-center justify-between border-b border-gray-200"
        >
          <span className="text-lg text-gray-700">Shipping</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        <Link
          href="/returns"
          className="w-full py-4 flex items-center justify-between border-b border-gray-200"
        >
          <span className="text-lg text-gray-700">Returns</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        <Link
          href="/about"
          className="w-full py-4 flex items-center justify-between border-b border-gray-200"
        >
          <span className="text-lg text-gray-700">About Us</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>

        <Link
          href="/size-guide"
          className="w-full py-4 flex items-center justify-between"
        >
          <span className="text-lg text-gray-700">Size Chart</span>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </Link>
      </div>
    </div>
  )
}
