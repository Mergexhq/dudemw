'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/domains/auth/context'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireAdmin?: boolean
  redirectTo?: string
}

export default function AuthGuard({
  children,
  requireAuth = false,
  requireAdmin = false,
  redirectTo = '/auth/login'
}: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (requireAuth && !user) {
      router.push(redirectTo)
      return
    }

    if (requireAdmin && (!user || !user.id)) {
      router.push(redirectTo)
      return
    }
  }, [user, isLoading, requireAuth, requireAdmin, redirectTo, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (requireAuth && !user) {
    return null
  }

  if (requireAdmin && (!user || !user.id)) {
    return null
  }

  return <>{children}</>
}
