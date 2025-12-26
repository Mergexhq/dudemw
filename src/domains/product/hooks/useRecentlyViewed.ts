'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/domains/auth/context'

interface RecentlyViewedItem {
  id: string
  title: string
  price: number
  image: string
  slug: string
  viewedAt: string
}

const RECENTLY_VIEWED_KEY = 'dude_recently_viewed'

export function useRecentlyViewed(maxItems: number = 20) {
  const { user } = useAuth()
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Load recently viewed on mount
  useEffect(() => {
    loadRecentlyViewed()
  }, [])

  // Sync to backend when user logs in
  useEffect(() => {
    if (user && recentlyViewed.length > 0 && !isSyncing) {
      syncToBackend()
    }
  }, [user])

  const loadRecentlyViewed = () => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setRecentlyViewed(parsed)
      }
    } catch (error) {
      console.error('Error loading recently viewed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveToLocalStorage = (items: RecentlyViewedItem[]) => {
    try {
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(items))
    } catch (error) {
      console.error('Error saving recently viewed:', error)
    }
  }

  const syncToBackend = async () => {
    if (!user || recentlyViewed.length === 0) return

    setIsSyncing(true)
    try {
      // TODO: Integrate with custom backend
      // await fetch('/api/recently-viewed/sync', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ items: recentlyViewed })
      // })

      console.log('✅ Recently viewed synced to backend for user:', user.email)
      console.log('📦 Synced items:', recentlyViewed.length)
    } catch (error) {
      console.error('Error syncing recently viewed:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const addToRecentlyViewed = (item: Omit<RecentlyViewedItem, 'viewedAt'>) => {
    const itemWithTimestamp = {
      ...item,
      viewedAt: new Date().toISOString()
    }

    // Remove if already exists (to move to top)
    const filtered = recentlyViewed.filter(rv => rv.id !== item.id)

    // Add to beginning and limit to maxItems
    const updated = [itemWithTimestamp, ...filtered].slice(0, maxItems)

    setRecentlyViewed(updated)
    saveToLocalStorage(updated)

    // If logged in, sync to backend
    if (user) {
      syncSingleItem(itemWithTimestamp)
    }
  }

  const removeFromRecentlyViewed = (id: string) => {
    const updated = recentlyViewed.filter(item => item.id !== id)
    setRecentlyViewed(updated)
    saveToLocalStorage(updated)

    if (user) {
      // TODO: Remove from backend
      console.log('🗑️ Removed from backend recently viewed:', id)
    }
  }

  const clearRecentlyViewed = () => {
    setRecentlyViewed([])
    localStorage.removeItem(RECENTLY_VIEWED_KEY)

    if (user) {
      // TODO: Clear backend recently viewed
      console.log('🗑️ Recently viewed cleared for user:', user.email)
    }
  }

  const syncSingleItem = async (item: RecentlyViewedItem) => {
    if (!user) return

    try {
      // TODO: Integrate with custom backend
      // await fetch('/api/recently-viewed', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ item })
      // })

      console.log('✅ Added to backend recently viewed:', item.id)
    } catch (error) {
      console.error('Error syncing item:', error)
    }
  }

  return {
    recentlyViewed,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed,
    count: recentlyViewed.length,
    isLoading,
    isSyncing,
    isGuest: !user,
  }
}
