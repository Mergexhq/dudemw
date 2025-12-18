'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLogoutPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Sign out from Supabase
        await supabase.auth.signOut()

        // Redirect to admin login
        router.push('/admin/login')
        router.refresh()
      } catch (error) {
        console.error('Logout error:', error)
        // Redirect anyway
        router.push('/admin/login')
      }
    }

    performLogout()
  }, [router, supabase])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center text-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-lg">Logging out...</p>
      </div>
    </div>
  )
}
