import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Get hostname to detect subdomain
    const hostname = request.headers.get('host') || ''
    const isAdminSubdomain = hostname.startsWith('admin.')

    // Clone request headers and inject pathname so server components can read it via headers()
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', request.nextUrl.pathname)

    let response = NextResponse.next({
      request: {
        headers: requestHeaders,
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
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set cookies with proper domain for cross-subdomain sharing
              const cookieOptions = {
                ...options,
                // If in production, set domain to allow sharing between subdomains
                domain: process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_COOKIE_DOMAIN
                  ? process.env.NEXT_PUBLIC_COOKIE_DOMAIN
                  : options?.domain,
              }
              response.cookies.set(name, value, cookieOptions)
            })
          },
        },
      }
    )

    // Refresh session if expired - required for Server Components
    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // ===== ADMIN SUBDOMAIN ROUTING =====
    if (isAdminSubdomain) {
      console.log('[Middleware] Admin subdomain detected:', hostname, 'Path:', pathname)

      // Public routes on admin subdomain (no /admin prefix needed)
      const publicAdminRoutes = ['/login', '/setup', '/recover', '/pending', '/logout']
      const isPublicAdminRoute = publicAdminRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

      // Skip auth check for public routes and static assets
      if (!isPublicAdminRoute && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
        if (!user) {
          console.log('[Middleware] Unauthenticated user on admin subdomain, redirecting to login')
          return NextResponse.redirect(new URL('/login', request.url))
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
          await supabase.auth.signOut()
          return NextResponse.redirect(new URL('/login', request.url))
        }

        // Redirect to pending page if not active
        if (!adminProfile.is_active) {
          console.log('[Middleware] Admin not active:', user.id)
          return NextResponse.redirect(new URL('/pending', request.url))
        }

        console.log('[Middleware] Admin access granted:', user.id)
      }

      // Rewrite admin subdomain paths to /admin/* internally
      // Example: admin.domain.com/products -> domain.com/admin/products (internal)
      if (!pathname.startsWith('/admin') && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
        const url = request.nextUrl.clone()
        url.pathname = `/admin${pathname}`
        console.log('[Middleware] Rewriting admin subdomain path:', pathname, '->', url.pathname)
        return NextResponse.rewrite(url)
      }

      return response
    }

    // ===== MAIN DOMAIN ROUTING =====

    // Block direct /admin access on main domain (redirect to admin subdomain)
    if (pathname.startsWith('/admin')) {
      console.log('[Middleware] Redirecting /admin path to admin subdomain:', pathname)
      const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || `https://admin.${hostname}`
      const redirectPath = pathname.replace('/admin', '')
      return NextResponse.redirect(new URL(redirectPath || '/', adminUrl))
    }

    // Protected store routes
    const protectedStoreRoutes = ['/orders']
    const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-otp', '/auth/callback']

    const isProtectedStoreRoute = protectedStoreRoutes.some(route => pathname.startsWith(route))
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

    // Redirect authenticated users away from auth pages
    if (isAuthRoute && user) {
      return NextResponse.redirect(new URL('/profile', request.url))
    }

    // Redirect unauthenticated users from protected store routes
    if (isProtectedStoreRoute && !user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    return response
  } catch (error) {
    console.error('[Middleware] Critical error:', error)
    // Return next response to prevent blocking the request
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    // Exclude static files more explicitly to reduce middleware overhead
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
