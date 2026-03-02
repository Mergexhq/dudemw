import { auth, currentUser } from '@clerk/nextjs/server'
import { cookies } from 'next/headers'

/**
 * Get the current authenticated user from Clerk.
 * Returns a normalized user object for use in server components/actions.
 */
export async function getCurrentUser() {
  try {
    const { userId } = await auth()

    if (!userId) return null

    const user = await currentUser()
    if (!user) return null

    return {
      id: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      name: user.fullName || user.firstName || 'User',
      phone: user.phoneNumbers[0]?.phoneNumber || null,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Get just the Clerk userId (cheaper — no extra HTTP call).
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const { userId } = await auth()
    return userId
  } catch {
    return null
  }
}

/**
 * Get or create a guest ID for unauthenticated users.
 */
export async function getGuestIdForAuth() {
  try {
    const cookieStore = await cookies()
    const guestId = cookieStore.get('guest_id')?.value

    if (!guestId) {
      const newGuestId = crypto.randomUUID()
      cookieStore.set('guest_id', newGuestId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      })
      return newGuestId
    }

    return guestId
  } catch (error) {
    console.error('Error getting guest ID:', error)
    return crypto.randomUUID()
  }
}

/**
 * Check if the current user's email is in the ADMIN_EMAILS list.
 * Used as a lightweight admin gate without hitting the DB.
 */
export async function isAdmin() {
  try {
    const user = await getCurrentUser()
    if (!user) return false
    const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
    return adminEmails.includes(user.email)
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}
