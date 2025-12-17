import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Admin routes that don't require authentication
  const publicAdminRoutes = ['/admin/login', '/admin/setup', '/admin/recover', '/admin/pending', '/admin/logout']
  const isPublicAdminRoute = publicAdminRoutes.some(route => pathname.startsWith(route))

  // Protected store routes
  const protectedStoreRoutes = ['/account', '/orders', '/profile']
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-otp', '/auth/callback', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-otp', '/callback']
  
  const isProtectedStoreRoute = protectedStoreRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = pathname.startsWith('/admin')

  // Redirect authenticated users away from auth pages (store only)
  if (isAuthRoute && user && !isAdminRoute) {
    return NextResponse.redirect(new URL('/profile', request.url))
  }

  // Redirect unauthenticated users from protected store routes
  if (isProtectedStoreRoute && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Admin route protection
  if (isAdminRoute && !isPublicAdminRoute) {
    // Redirect to login if not authenticated
    if (!user) {
      console.log('[Middleware] Unauthenticated user trying to access:', pathname)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Check admin profile
    const { data: adminProfile, error: profileError } = await supabase
      .from('admin_profiles')
      .select('role, is_active')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.error('[Middleware] Error fetching admin profile:', profileError)
    }

    // Redirect if not an admin
    if (!adminProfile) {
      console.log('[Middleware] User has no admin profile:', user.id)
      // Clear session and redirect to login
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Redirect to pending page if not active
    if (!adminProfile.is_active) {
      console.log('[Middleware] Admin not active:', user.id)
      return NextResponse.redirect(new URL('/admin/pending', request.url))
    }

    // Admin is authenticated and active - allow access
    console.log('[Middleware] Admin access granted:', user.id)
  }

  // Special handling: redirect authenticated admin users away from login page
  if (pathname === '/admin/login' && user) {
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('is_active')
      .eq('user_id', user.id)
      .single()

    if (adminProfile) {
      if (adminProfile.is_active) {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else {
        return NextResponse.redirect(new URL('/admin/pending', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
