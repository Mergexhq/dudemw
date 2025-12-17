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
  const publicAdminRoutes = ['/admin/login', '/admin/setup', '/admin/recover']
  const isPublicAdminRoute = publicAdminRoutes.some(route => pathname.startsWith(route))

  // Protected store routes
  const protectedStoreRoutes = ['/account', '/orders', '/profile']
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-otp', '/callback']
  
  const isProtectedStoreRoute = protectedStoreRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = pathname.startsWith('/admin')

  // Redirect authenticated users away from auth pages (store only)
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/profile', request.url))
  }

  // Redirect unauthenticated users from protected store routes
  if (isProtectedStoreRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin route protection
  if (isAdminRoute && !isPublicAdminRoute) {
    // Redirect to login if not authenticated
    if (!user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Check admin profile
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('role, is_active')
      .eq('user_id', user.id)
      .single()

    // Redirect if not an admin or not active
    if (!adminProfile || !adminProfile.is_active) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Admin is authenticated and active - allow access
  }

  // Special handling: redirect authenticated admin users away from login page
  if (pathname === '/admin/login' && user) {
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('is_active')
      .eq('user_id', user.id)
      .single()

    if (adminProfile?.is_active) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
