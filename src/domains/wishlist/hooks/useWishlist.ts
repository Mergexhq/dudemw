'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/domains/auth/context'
import { getOrCreateGuestId } from '@/lib/utils/guest'

import { WishlistItem } from '../types'

const WISHLIST_KEY = 'dude_wishlist'

export function useWishlist() {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Load wishlist on mount
  useEffect(() => {
    loadWishlist()
  }, [user])

  // Sync to backend when user logs in
  useEffect(() => {
    if (user && wishlist.length > 0 && !isSyncing) {
      syncToBackend()
    }
  }, [user])

  const loadWishlist = useCallback(async () => {
    setIsLoading(true)
    try {
      if (user) {
        // Authenticated user - fetch from database
        const response = await fetch('/api/wishlist')
        if (response.ok) {
          const { items } = await response.json()
          const formattedItems = items.map((item: any) => {
            const variant = item.product_variants
            const product = item.products
            const variantImage = variant?.variant_images?.[0]?.image_url || variant?.image_url

            // Price calculations - Ensure numbers
            // Priority: variant prices > product prices
            let currentPrice: number = 0
            let originalPrice: number = 0

            if (variant) {
              // Variant exists - use variant pricing
              if (variant.discount_price && Number(variant.discount_price) > 0) {
                // Variant has discount price (sale price)
                currentPrice = Number(variant.discount_price)
                originalPrice = Number(variant.price || 0)
              } else if (variant.price && Number(variant.price) > 0) {
                // Variant has regular price only
                currentPrice = Number(variant.price)
                // Check if product has original_price to show as MRP
                originalPrice = Number(product?.original_price || 0)
              }
            } else if (product) {
              // No variant - use product-level pricing
              currentPrice = Number(product.price || 0)
              originalPrice = Number(product.original_price || 0)
            }

            // Calculate discount percentage
            const discount = originalPrice && originalPrice > currentPrice && currentPrice > 0
              ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
              : 0

            return {
              id: item.product_id,
              name: product?.title || 'Product',
              price: currentPrice,
              originalPrice: discount > 0 ? originalPrice : undefined,
              discount: discount > 0 ? discount : undefined,
              image: variantImage || product?.images?.[0] || '/images/placeholder-product.jpg',
              slug: product?.slug || '',
              variantId: item.variant_id,
              variantName: variant?.name,
              // Try to extract size and color from variant name
              size: variant?.name?.split('/')[0]?.trim(),
              color: variant?.name?.split('/')[1]?.trim(),
            }
          })
          setWishlist(formattedItems)
          // Update local storage for offline access
          saveToLocalStorage(formattedItems)
        }
      } else {
        // Guest user - load from local storage
        const stored = localStorage.getItem(WISHLIST_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          setWishlist(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading wishlist:', error)
      // Fallback to local storage
      try {
        const stored = localStorage.getItem(WISHLIST_KEY)
        if (stored) {
          setWishlist(JSON.parse(stored))
        }
      } catch (e) {
        console.error('Error loading from localStorage:', e)
      }
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const saveToLocalStorage = (items: WishlistItem[]) => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Error saving wishlist:', error)
    }
  }

  const syncToBackend = async () => {
    if (!user || wishlist.length === 0) return

    setIsSyncing(true)
    try {
      const response = await fetch('/api/wishlist/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: wishlist })
      })

      if (response.ok) {
        const { syncedCount, skippedCount } = await response.json()
        console.log(`✅ Wishlist synced: ${syncedCount} added, ${skippedCount} skipped`)

        // Reload from database to get the merged wishlist
        await loadWishlist()
      }
    } catch (error) {
      console.error('Error syncing wishlist:', error)
    } finally {
      setIsSyncing(false)
    }
  }


  const addToWishlist = async (item: WishlistItem) => {
    // Check if this exact variant already exists
    const exists = wishlist.some(w =>
      w.id === item.id &&
      (w.variantId === item.variantId || (!w.variantId && !item.variantId))
    )
    if (exists) return false

    // Optimistically update UI
    const updated = [...wishlist, item]
    setWishlist(updated)
    saveToLocalStorage(updated)

    // Sync to backend
    try {
      if (user || !user) { // Always try to sync, even for guest users
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.id,
            variantId: item.variantId
          })
        })

        if (!response.ok) {
          // Revert on error
          setWishlist(wishlist)
          saveToLocalStorage(wishlist)
          return false
        }
      }
      return true
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      // Keep the optimistic update even if sync fails
      return true
    }
  }

  const removeFromWishlist = async (id: string, variantId?: string) => {
    // Optimistically update UI - remove the specific variant
    const updated = wishlist.filter(item => {
      if (variantId) {
        return !(item.id === id && item.variantId === variantId)
      }
      return !(item.id === id && !item.variantId)
    })
    setWishlist(updated)
    saveToLocalStorage(updated)

    // Sync to backend
    try {
      const url = variantId
        ? `/api/wishlist?productId=${id}&variantId=${variantId}`
        : `/api/wishlist?productId=${id}`

      const response = await fetch(url, {
        method: 'DELETE'
      })

      if (!response.ok) {
        // Revert on error
        setWishlist(wishlist)
        saveToLocalStorage(wishlist)
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
    }
  }

  const isInWishlist = (id: string, variantId?: string) => {
    return wishlist.some(item => {
      if (variantId) {
        return item.id === id && item.variantId === variantId
      }
      return item.id === id && !item.variantId
    })
  }

  const toggleWishlist = async (item: WishlistItem) => {
    if (isInWishlist(item.id, item.variantId)) {
      await removeFromWishlist(item.id, item.variantId)
      return false
    } else {
      await addToWishlist(item)
      return true
    }
  }

  const clearWishlist = async () => {
    setWishlist([])
    localStorage.removeItem(WISHLIST_KEY)

    if (user) {
      // Clear all user's wishlist items from database
      try {
        for (const item of wishlist) {
          await fetch(`/api/wishlist?productId=${item.id}`, {
            method: 'DELETE'
          })
        }
      } catch (error) {
        console.error('Error clearing wishlist from database:', error)
      }
    }
  }

  return {
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    count: wishlist.length,
    isLoading,
    isSyncing,
    isGuest: !user,
    reload: loadWishlist,
  }
}
