'use client'

import { Search } from 'lucide-react'
import Link from 'next/link'
import { ProductCard } from '@/domains/product'
// import WishlistSyncMessage from '@/components/WishlistSyncMessage' // Component not found, commenting out
import Footer from '@/lib/layout/layout/Footer'
import { useGuestProfile } from '../hooks/useGuestProfile'

export default function DesktopGuestView() {
  const {
    trackingData,
    setTrackingData,
    handleTrackOrder,
    wishlistProducts,
    recentlyViewedProducts,
    wishlistCount,
  } = useGuestProfile(8)

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Full Width Login Section */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Unlock More Features
              </h2>
              <p className="text-gray-600 text-base mb-6 leading-relaxed">
                Save your details for faster checkout and see your full order history.
              </p>
              <Link
                href="/auth/login"
                className="inline-block bg-red-600 text-white py-4 px-12 rounded-lg font-semibold hover:bg-red-700 transition-colors"
              >
                Sign In / Create Account
              </Link>
            </div>
          </div>

          {/* Track Orders Section with Background Image */}
          <div className="relative bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden min-h-[400px]">
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url('/illustration/track_order.png')"
              }}
            />

            {/* Overlay Content */}
            <div className="relative z-10 p-8 h-full flex items-center">
              <div className="w-full max-w-md">
                <h2 className="text-2xl font-bold text-black mb-6">
                  Track Recent Orders
                </h2>

                <form onSubmit={handleTrackOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={trackingData.email}
                      onChange={(e) => setTrackingData({ ...trackingData, email: e.target.value })}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Order Number
                    </label>
                    <input
                      type="text"
                      value={trackingData.orderNumber}
                      onChange={(e) => setTrackingData({ ...trackingData, orderNumber: e.target.value })}
                      placeholder="Enter your order number"
                      className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mt-4"
                  >
                    <Search className="w-5 h-5" />
                    Track Order
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Your Wishlist Section - Only show if there are items */}
          {wishlistProducts.length > 0 && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-3xl tracking-wider text-black">
                  YOUR WISHLIST
                </h2>
                <Link href="/wishlist" className="text-red-600 font-semibold hover:text-red-700 transition-colors">
                  See All →
                </Link>
              </div>

              {/* Wishlist Products Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlistProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Wishlist Sync Message - Component not found, commenting out */}
              {/* <div className="mt-6">
                <WishlistSyncMessage />
              </div> */}

              {wishlistCount === 0 && (
                <p className="text-sm text-gray-500 mt-6 text-center">
                  Sign in to save your wishlist across all devices.
                </p>
              )}
            </div>
          )}

          {/* Recently Viewed Section - Only show if there are items */}
          {recentlyViewedProducts.length > 0 && (
            <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-3xl tracking-wider text-black">
                  RECENTLY VIEWED
                </h2>
              </div>

              {/* Recently Viewed Products Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {recentlyViewedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {/* Quick Links Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link
              href="/faq"
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-red-600 hover:shadow-md transition-all text-center"
            >
              <span className="text-lg font-medium text-gray-700">FAQ</span>
            </Link>

            <Link
              href="/shipping"
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-red-600 hover:shadow-md transition-all text-center"
            >
              <span className="text-lg font-medium text-gray-700">Shipping</span>
            </Link>

            <Link
              href="/returns"
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-red-600 hover:shadow-md transition-all text-center"
            >
              <span className="text-lg font-medium text-gray-700">Returns</span>
            </Link>

            <Link
              href="/about"
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-red-600 hover:shadow-md transition-all text-center"
            >
              <span className="text-lg font-medium text-gray-700">About Us</span>
            </Link>

            <Link
              href="/size-guide"
              className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:border-red-600 hover:shadow-md transition-all text-center"
            >
              <span className="text-lg font-medium text-gray-700">Size Chart</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  )
}
