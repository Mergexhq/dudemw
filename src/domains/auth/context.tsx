'use client'

import { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'

interface Address {
  id: string
  name: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
  isDefault: boolean
}

interface User {
  id: string
  name: string
  email: string
  phone?: string
  profilePicture?: string
  addresses?: Address[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser()
  const { signOut } = useClerk()

  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    if (isLoaded && clerkUser) {
      setUser({
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || 'User',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        phone: clerkUser.primaryPhoneNumber?.phoneNumber || undefined,
        profilePicture: clerkUser.imageUrl,
        addresses: [], // Addresses will be fetched from Supabase when needed
      })
    } else if (isLoaded && !clerkUser) {
      setUser(null)
    }
  }, [isLoaded, clerkUser])

  const logout = async () => {
    await signOut()
  }

  const updateUser = async (data: Partial<User>) => {
    if (!clerkUser) return

    try {
      const updates: any = {}

      if (data.name) {
        const parts = data.name.split(' ')
        updates.firstName = parts[0]
        if (parts.length > 1) {
          updates.lastName = parts.slice(1).join(' ')
        }
      }

      await clerkUser.update(updates)

      // We don't update profilePicture here as Clerk handles it differently
      // Phone updates would require verification in Clerk

    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: !isLoaded,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
