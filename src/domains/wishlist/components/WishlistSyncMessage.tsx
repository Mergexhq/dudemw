'use client'

import { useAuth } from '@/domains/auth/context'
import { useWishlist } from '@/domains/wishlist'
import { Heart, Check } from 'lucide-react'
import Link from 'next/link'

export default function WishlistSyncMessage() {
  const { user } = useAuth()
  const { count, isSyncing } = useWishlist()

  // Don't show if user is logged in or wishlist is empty
  if (user || count === 0) return null

  return (
    <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-600 p-4 mb-4 rounded-lg">
      <div className="flex items-start gap-3">
        <Heart className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {count} {count === 1 ? 'item' : 'items'} in your wishlist!
          </p>
          <p className="text-xs text-gray-700 mb-2">
            Sign in pannita wishlist permanent save aagum da, all devices-la sync aagum! 🔥
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-red-600 hover:text-red-700"
          >
            <Check className="w-4 h-4" />
            Sign In to Save Forever
          </Link>
        </div>
      </div>
    </div>
  )
}
