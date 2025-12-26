'use client'

import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useWishlist } from '@/domains/wishlist/hooks/useWishlist'

export default function WishlistSection() {
  const { wishlist, removeFromWishlist, isLoading } = useWishlist()

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-pulse">
          <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4" />
          <div className="h-6 w-48 bg-gray-200 rounded mx-auto mb-2" />
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    )
  }

  if (wishlist.length === 0) {
    return (
      <div className="text-center py-12">
        <Heart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">Your Wishlist is Empty</h3>
        <p className="text-gray-600 mb-6">Save your favorite items here</p>
        <Link
          href="/products"
          className="inline-block bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Explore Products
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">My Wishlist ({wishlist.length})</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {wishlist.map((item) => (
          <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-black transition-colors group">
            <Link href={`/products/${item.slug}`} className="block">
              <div className="aspect-square bg-gray-100 relative">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              </div>
            </Link>

            <div className="p-4">
              <Link href={`/products/${item.slug}`}>
                <h3 className="font-medium mb-2 hover:text-red-600 transition-colors line-clamp-2">
                  {item.title}
                </h3>
              </Link>

              {/* Price with MRP and Discount */}
              <div className="mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-lg">₹{item.price.toLocaleString()}</span>
                  {item.comparePrice && item.comparePrice > item.price && (
                    <>
                      <span className="text-sm text-gray-500 line-through">
                        ₹{item.comparePrice.toLocaleString()}
                      </span>
                      <span className="text-xs font-semibold text-red-600">
                        ({Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)}% OFF)
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/products/${item.slug}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  View
                </Link>
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
