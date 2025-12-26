"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Sidebar } from "@/components/common/sidebar"
import { Header } from "@/components/common/header"
import { Sheet, SheetContent } from "@/components/ui/sheet"

function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-100 border-t-red-600 mx-auto mb-6"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 bg-red-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <h3 className="font-heading text-xl font-bold text-gray-900 mb-2">Admin Portal</h3>
        <p className="text-gray-600">Verifying authentication...</p>
      </div>
    </div>
  )
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Auth routes that don't need the admin layout
  // Support both subdomain routing (/login) and path routing (/admin/login)
  const authRoutes = ['/login', '/setup', '/recover', '/pending', '/logout', '/admin/login', '/admin/setup', '/admin/recover', '/admin/pending', '/admin/logout']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Settings routes that have their own complete layout
  const isSettingsRoute = pathname.startsWith('/admin/settings') || pathname.startsWith('/settings')


  // Client-side auth verification (backup to middleware)
  useEffect(() => {
    // Skip auth check for auth routes
    const skipAuth = authRoutes.some(route => pathname.startsWith(route))
    if (skipAuth) {
      setIsCheckingAuth(false)
      return
    }

    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/admin/login')
        return
      }

      setIsCheckingAuth(false)
    }

    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Render auth routes without layout
  if (isAuthRoute) {
    if (!mounted) return null
    return <>{children}</>
  }

  // Render settings routes without admin layout wrapper (has its own layout)
  if (isSettingsRoute) {
    if (!mounted) return <LoadingScreen />
    return isCheckingAuth ? <LoadingScreen /> : <>{children}</>
  }

  // Show loading for protected routes
  if (isCheckingAuth || !mounted) {
    return <LoadingScreen />
  }

  // Render admin layout for other admin routes
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-red-50/30">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-white border-r border-red-100" aria-describedby="mobile-menu-description">
          <span id="mobile-menu-description" className="sr-only">
            Navigation menu
          </span>
          <Sidebar collapsed={false} />
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col overflow-hidden p-1 md:p-2">
        <div className="flex-1 flex flex-col bg-white rounded-xl lg:rounded-2xl shadow-lg border border-red-100/50 backdrop-blur-sm overflow-hidden">
          <Header
            sidebarCollapsed={sidebarCollapsed}
            onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
            mobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-4 md:p-6 lg:p-10 w-full max-w-full">
              <div className="max-w-7xl mx-auto w-full min-w-0">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}