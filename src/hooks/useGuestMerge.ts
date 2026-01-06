"use client"

import { useEffect, useRef } from 'react'
import { useAuth } from '@/domains/auth/context'
import { mergeGuestData } from '@/lib/actions/guest-merge'
import { toast } from 'sonner'

/**
 * Hook that automatically merges guest data when user logs in/signs up
 * 
 * Usage: Add to root layout or auth provider
 * ```tsx
 * export default function RootLayout({ children }) {
 *   useGuestMerge() // Add this line
 *   return <html>...</html>
 * }
 * ```
 */
export function useGuestMerge() {
    const { user, isLoading } = useAuth()
    const hasMerged = useRef(false)
    const mergeInProgress = useRef(false)

    useEffect(() => {
        // Only run once when user first loads and is authenticated
        if (isLoading || !user || hasMerged.current || mergeInProgress.current) {
            return
        }

        const performMerge = async () => {
            mergeInProgress.current = true

            try {
                // Get guest session ID from localStorage
                const guestId = localStorage.getItem('guest_session_id')

                // If no guest session, nothing to merge
                if (!guestId) {
                    console.log('[useGuestMerge] No guest session found, skipping merge')
                    hasMerged.current = true
                    return
                }

                // Check if we've already merged this session
                const mergeKey = `merged_${guestId}_${user.id}`
                if (sessionStorage.getItem(mergeKey)) {
                    console.log('[useGuestMerge] Already merged this session')
                    hasMerged.current = true
                    return
                }

                console.log('[useGuestMerge] Starting guest data merge...')

                const result = await mergeGuestData({
                    userId: user.id,
                    email: user.email,
                    phone: user.phone,
                    guestId: guestId
                })

                if (result.success) {
                    console.log('[useGuestMerge] Merge successful:', result.mergedItems)

                    // Mark as merged in session storage
                    sessionStorage.setItem(mergeKey, 'true')

                    // Clear guest session since data is now merged
                    localStorage.removeItem('guest_session_id')

                    // Show success notification if items were merged
                    const totalItems = (result.mergedItems?.cartItems || 0) +
                        (result.mergedItems?.wishlistItems || 0) +
                        (result.mergedItems?.orders || 0)

                    if (totalItems > 0) {
                        const messages: string[] = []
                        if (result.mergedItems?.cartItems) {
                            messages.push(`${result.mergedItems.cartItems} cart item(s)`)
                        }
                        if (result.mergedItems?.wishlistItems) {
                            messages.push(`${result.mergedItems.wishlistItems} wishlist item(s)`)
                        }
                        if (result.mergedItems?.orders) {
                            messages.push(`${result.mergedItems.orders} order(s)`)
                        }

                        toast.success('Welcome back!', {
                            description: `We saved your ${messages.join(', ')}`
                        })
                    }

                    hasMerged.current = true
                } else {
                    console.error('[useGuestMerge] Merge failed:', result.error)
                    // Don't throw error - merge failure shouldn't block user experience
                    hasMerged.current = true
                }
            } catch (error) {
                console.error('[useGuestMerge] Unexpected error:', error)
                hasMerged.current = true
            } finally {
                mergeInProgress.current = false
            }
        }

        performMerge()
    }, [user, isLoading])

    return null
}
