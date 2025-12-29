'use client'

import { useWishlist } from '../hooks/useWishlist'
import EmptyWishlist from './EmptyWishlist'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getProductsByIds } from '@/app/actions/wishlist'
import { WishlistItem } from '../types'
import { WishlistSkeleton } from './WishlistSkeleton'
import { Skeleton } from '@/components/ui/skeleton'

export default function WishlistPage() {
  const { wishlist, wishlistIds, removeFromWishlist, isLoading, isGuest } = useWishlist()
  const [guestProducts, setGuestProducts] = useState<WishlistItem[]>([])
  const [isFetchingGuest, setIsFetchingGuest] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch product details for guest wishlist items
  useEffect(() => {
    const fetchGuestProducts = async () => {
      if (!mounted || !isGuest || wishlistIds.size === 0) {
        setGuestProducts([])
        return
      }

      console.log('[WishlistPage] Fetching guest products for IDs:', Array.from(wishlistIds))
      setIsFetchingGuest(true)

      try {
        const result = await getProductsByIds(Array.from(wishlistIds))
        console.log('[WishlistPage] Fetched products:', result)

        if (result.success && result.products) {
          setGuestProducts(result.products.map(p => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            price: p.price,
            comparePrice: p.comparePrice,
            image: p.image
          })))
        }
      } catch (error) {
        console.error('[WishlistPage] Error fetching guest products:', error)
      } finally {
        setIsFetchingGuest(false)
      }
    }

    fetchGuestProducts()
  }, [mounted, isGuest, wishlistIds])

  // Determine which products to display
  const displayItems = isGuest ? guestProducts : wishlist.filter(item => item.title && item.slug)

  if (!mounted || isLoading || isFetchingGuest) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-6 w-24" />
        </div>
        <WishlistSkeleton />
      </div>
    )
  }

  if (displayItems.length === 0) {
    return <EmptyWishlist />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold mb-2">My Wishlist</h1>
        <p className="text-gray-600">{displayItems.length} {displayItems.length === 1 ? 'item' : 'items'} saved</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {displayItems.map((item) => {
          // Calculate discount if comparePrice exists
          const discount = item.comparePrice && item.comparePrice > item.price
            ? Math.round(((item.comparePrice - item.price) / item.comparePrice) * 100)
            : 0

          return (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-black transition-colors group relative">
              <Link href={`/products/${item.slug}`} className="block">
                <div className="aspect-square bg-gray-100 relative">
                  <Image
                    src={item.image || '/images/placeholder-product.jpg'}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </Link>

              <button
                onClick={() => removeFromWishlist(item.id)}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors z-10"
                aria-label="Remove from wishlist"
              >
                <Heart className="w-5 h-5 fill-red-600 text-red-600" />
              </button>

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
                    {item.comparePrice && discount > 0 && (
                      <>
                        <span className="text-sm text-gray-500 line-through">
                          ₹{item.comparePrice.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-red-600">
                          ({discount}% OFF)
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Link
                  href={`/products/${item.slug}`}
                  className="w-full flex items-center justify-center gap-2 bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                >
                  <ShoppingCart className="w-4 h-4" />
                  View Product
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
