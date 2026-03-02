'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClerk } from '@clerk/nextjs'

export default function AdminLogoutPage() {
  const router = useRouter()
  const { signOut } = useClerk()

  useEffect(() => {
    const performLogout = async () => {
      try {
        await signOut({ redirectUrl: '/admin/login' })
      } catch (error) {
        console.error('Logout error:', error)
        router.push('/admin/login')
      }
    }
    performLogout()
  }, [])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center text-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-lg">Logging out...</p>
      </div>
    </div>
  )
}
