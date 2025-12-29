'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/domains/auth/context'
import {
  addToWishlist as addToWishlistAction,
  removeFromWishlist as removeFromWishlistAction,
  getWishlistWithProducts,
  mergeGuestWishlist,
  clearWishlist as clearWishlistAction
} from '@/app/actions/wishlist'
import { WishlistItem } from '../types'
import { toast } from 'sonner'

const WISHLIST_KEY = 'wishlist_items' // Flat array of product IDs

export function useWishlist() {
  const { user } = useAuth()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [hasMerged, setHasMerged] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Handle mounting state
  useEffect(() => {
    setMounted(true)
  }, [])

  // O(1) lookup Set derived from wishlist
  const wishlistIds = useMemo(() => {
    return new Set(wishlist.map(item => item.id))
  }, [wishlist])

  // Load guest wishlist IDs from localStorage
  const getGuestWishlistIds = useCallback((): string[] => {
    if (!mounted) return []
    try {
      const stored = localStorage.getItem(WISHLIST_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : []
      }
    } catch (error) {
      console.error('Error reading guest wishlist:', error)
    }
    return []
  }, [mounted])

  // Save guest wishlist IDs to localStorage
  const saveGuestWishlistIds = useCallback((ids: string[]) => {
    if (!mounted) return
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(ids))
    } catch (error) {
      console.error('Error saving guest wishlist:', error)
    }
  }, [mounted])

  // Clear guest wishlist from localStorage
  const clearGuestWishlist = useCallback(() => {
    if (!mounted) return
    try {
      localStorage.removeItem(WISHLIST_KEY)
    } catch (error) {
      console.error('Error clearing guest wishlist:', error)
    }
  }, [mounted])

  // Load wishlist on mount and when auth changes
  const loadWishlist = useCallback(async () => {
    if (!mounted) return
    
    console.log('[useWishlist.loadWishlist] Starting load, user:', user?.id)
    setIsLoading(true)
    try {
      if (user) {
        // Authenticated user - fetch from database
        console.log('[useWishlist.loadWishlist] Fetching from database')
        const result = await getWishlistWithProducts()
        console.log('[useWishlist.loadWishlist] Result:', result)

        if (result.success && result.products) {
          console.log('[useWishlist.loadWishlist] Setting wishlist with', result.products.length, 'items')
          setWishlist(result.products.map(p => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            price: p.price,
            comparePrice: p.comparePrice,
            image: p.image,
            addedAt: p.addedAt
          })))
        } else if (result.error) {
          console.error('[useWishlist.loadWishlist] Error:', result.error)
          toast.error(result.error)
        }
      } else {
        // Guest user - we just have IDs, show empty until page loads products
        // WishlistPage will fetch products by these IDs
        const guestIds = getGuestWishlistIds()
        console.log('[useWishlist.loadWishlist] Guest mode,', guestIds.length, 'items in localStorage')
        // Create placeholder items for guest (actual product data loaded on WishlistPage)
        setWishlist(guestIds.map(id => ({
          id,
          title: '',
          slug: '',
          price: 0,
          image: ''
        })))
      }
    } catch (error) {
      console.error('[useWishlist.loadWishlist] Exception:', error)
      toast.error('Failed to load wishlist')
    } finally {
      setIsLoading(false)
    }
  }, [mounted, user, getGuestWishlistIds])

  // Initial load
  useEffect(() => {
    loadWishlist()
  }, [loadWishlist])

  // Merge guest wishlist on login
  useEffect(() => {
    const performMerge = async () => {
      if (mounted && user && !hasMerged) {
        const guestIds = getGuestWishlistIds()
        if (guestIds.length > 0) {
          setIsSyncing(true)
          try {
            const result = await mergeGuestWishlist(guestIds)
            if (result.success) {
              clearGuestWishlist()
              await loadWishlist() // Refresh from DB
              if (result.mergedCount && result.mergedCount > 0) {
                toast.success(`${result.mergedCount} item(s) synced to your wishlist`)
              }
            }
          } catch (error) {
            console.error('Error merging wishlist:', error)
          } finally {
            setIsSyncing(false)
          }
        }
        setHasMerged(true)
      }
    }
    performMerge()
  }, [mounted, user, hasMerged, getGuestWishlistIds, clearGuestWishlist, loadWishlist])

  // Add to wishlist
  const addToWishlist = useCallback(async (productId: string): Promise<boolean> => {
    console.log('[useWishlist.addToWishlist] Called with:', productId)
    console.log('[useWishlist.addToWishlist] User:', user?.id)
    console.log('[useWishlist.addToWishlist] Already in wishlist?', wishlistIds.has(productId))

    // Check if already wishlisted
    if (wishlistIds.has(productId)) {
      console.log('[useWishlist.addToWishlist] Already in wishlist, skipping')
      return false
    }

    // Optimistic update
    setWishlist(prev => [...prev, { id: productId, title: '', slug: '', price: 0, image: '' }])

    if (user) {
      // Authenticated - sync to backend
      console.log('[useWishlist.addToWishlist] Calling server action')
      const result = await addToWishlistAction(productId)
      console.log('[useWishlist.addToWishlist] Server action result:', result)

      if (!result.success) {
        // Rollback
        console.error('[useWishlist.addToWishlist] Failed, rolling back')
        setWishlist(prev => prev.filter(item => item.id !== productId))
        toast.error(result.error || 'Failed to add to wishlist')
        return false
      }
      console.log('[useWishlist.addToWishlist] Success!')
    } else {
      // Guest - save to localStorage
      console.log('[useWishlist.addToWishlist] Guest mode, saving to localStorage')
      const currentIds = getGuestWishlistIds()
      if (!currentIds.includes(productId)) {
        saveGuestWishlistIds([...currentIds, productId])
      }
    }

    toast.success('Added to wishlist')
    return true
  }, [user, wishlistIds, getGuestWishlistIds, saveGuestWishlistIds])

  // Remove from wishlist
  const removeFromWishlist = useCallback(async (productId: string): Promise<void> => {
    // Optimistic update
    const previousWishlist = [...wishlist]
    setWishlist(prev => prev.filter(item => item.id !== productId))

    if (user) {
      // Authenticated - sync to backend
      const result = await removeFromWishlistAction(productId)
      if (!result.success) {
        // Rollback
        setWishlist(previousWishlist)
        toast.error(result.error || 'Failed to remove from wishlist')
        return
      }
    } else {
      // Guest - update localStorage
      const currentIds = getGuestWishlistIds()
      saveGuestWishlistIds(currentIds.filter(id => id !== productId))
    }

    toast.success('Removed from wishlist')
  }, [user, wishlist, getGuestWishlistIds, saveGuestWishlistIds])

  // Check if product is wishlisted (O(1) lookup)
  const isWishlisted = useCallback((productId: string): boolean => {
    return wishlistIds.has(productId)
  }, [wishlistIds])

  // Toggle wishlist
  const toggleWishlist = useCallback(async (productId: string): Promise<boolean> => {
    if (isWishlisted(productId)) {
      await removeFromWishlist(productId)
      return false
    } else {
      return await addToWishlist(productId)
    }
  }, [isWishlisted, addToWishlist, removeFromWishlist])

  // Clear wishlist
  const clearWishlist = useCallback(async (): Promise<void> => {
    setWishlist([])

    if (user) {
      await clearWishlistAction()
    } else {
      clearGuestWishlist()
    }
  }, [user, clearGuestWishlist])

  return {
    wishlist,
    wishlistIds,
    addToWishlist,
    removeFromWishlist,
    isWishlisted,
    toggleWishlist,
    clearWishlist,
    count: wishlist.length,
    isLoading,
    isSyncing,
    isGuest: !user,
    reload: loadWishlist,
  }
}
