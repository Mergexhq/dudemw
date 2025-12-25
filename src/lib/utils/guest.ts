/**
 * Guest User Utilities
 * Manages guest user identification for wishlist and cart functionality
 */

const GUEST_ID_KEY = 'dude_guest_id'
const GUEST_ID_COOKIE = 'guest_id'

/**
 * Generate a unique guest ID
 * Format: guest_[timestamp]_[random]
 */
export function generateGuestId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 15)
    return `guest_${timestamp}_${random}`
}

/**
 * Get or create guest ID
 * Checks localStorage first, then generates new ID if not found
 */
export function getOrCreateGuestId(): string {
    // Server-side: just generate a new ID (cookie will be the source of truth)
    if (typeof window === 'undefined') {
        return generateGuestId()
    }

    try {
        // Check cookie first (source of truth)
        const cookieMatch = document.cookie.match(new RegExp(`(^| )${GUEST_ID_COOKIE}=([^;]+)`))
        let guestId = cookieMatch ? cookieMatch[2] : null

        // Fallback to localStorage
        if (!guestId) {
            guestId = localStorage.getItem(GUEST_ID_KEY)
        }

        if (!guestId) {
            // Generate new guest ID
            guestId = generateGuestId()
            localStorage.setItem(GUEST_ID_KEY, guestId)
        }

        // Always ensure cookie is set (important for server-side operations)
        // Set cookie with proper settings for production
        const maxAge = 60 * 60 * 24 * 365 // 1 year
        document.cookie = `${GUEST_ID_COOKIE}=${guestId}; path=/; max-age=${maxAge}; SameSite=Lax`

        return guestId
    } catch (error) {
        console.error('Error managing guest ID:', error)
        return generateGuestId() // Fallback to memory-only ID
    }
}

/**
 * Get guest ID from cookie (server-side)
 */
export function getGuestIdFromCookie(cookieString?: string): string | null {
    if (!cookieString) return null

    const cookies = cookieString.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
    }, {} as Record<string, string>)

    return cookies[GUEST_ID_COOKIE] || null
}

/**
 * Clear guest ID (called after user logs in and wishlist is synced)
 */
export function clearGuestId(): void {
    if (typeof window === 'undefined') return

    try {
        localStorage.removeItem(GUEST_ID_KEY)
        // Expire the cookie
        document.cookie = `${GUEST_ID_COOKIE}=; path=/; max-age=0`
    } catch (error) {
        console.error('Error clearing guest ID:', error)
    }
}
