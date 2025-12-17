'use client'

import { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

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
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  
  // Create client consistently
  const supabase = createClient()

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ? transformSupabaseUser(session.user) : null)
      } catch (error) {
        console.error('Error getting session:', error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ? transformSupabaseUser(session.user) : null)
        setIsLoading(false)
        
        // Handle proxy-specific auth events
        if (event === 'TOKEN_REFRESHED') {
          // Token was refreshed, user is still authenticated
          console.log('Token refreshed')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const transformSupabaseUser = (supabaseUser: SupabaseUser): User => ({
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || 'User',
    email: supabaseUser.email || '',
    phone: supabaseUser.user_metadata?.phone || supabaseUser.phone,
    addresses: [], // Addresses will be fetched from Supabase when needed
  })

  const logout = async () => {
    await supabase.auth.signOut()
  }

  const updateUser = async (data: Partial<User>) => {
    if (!user) return

    try {
      const updates: any = {}
      
      if (data.name) {
        updates.full_name = data.name
      }
      
      if (data.phone) {
        updates.phone = data.phone
      }

      const { error } = await supabase.auth.updateUser({
        data: updates
      })

      if (error) throw error
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
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
