import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isStoreProtectedRoute = createRouteMatcher(['/wishlist(.*)']);

export default clerkMiddleware(async (auth, request) => {
    try {
        const url = request.nextUrl;
        const hostname = request.headers.get("host") || "";
        const isAdminSubdomain = hostname.startsWith("admin.");

        // 1. Redundant path cleanup for admin subdomain
        // If the user visits admin.dudemw.com/admin/orders, redirect to admin.dudemw.com/orders
        // This keeps the URLs clean and prevents potential routing loops
        if (isAdminSubdomain && url.pathname.startsWith('/admin')) {
            const cleanPath = url.pathname.replace(/^\/admin/, '') || '/';
            const redirectUrl = new URL(cleanPath, request.url);
            return NextResponse.redirect(redirectUrl);
        }

        // 2. Subdomain routing for admin (Internal Rewrite)
        // If on admin subdomain and NOT an API/internals call, rewrite to the /admin route
        let targetPath = url.pathname;
        if (isAdminSubdomain && !url.pathname.startsWith('/api')) {
            targetPath = `/admin${url.pathname === '/' ? '' : url.pathname}`;
        }

        // Build request headers with x-pathname so server components can read it via headers()
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-pathname', targetPath);

        // 3. Auth Protection
        // Store routes: protect /wishlist
        if (isStoreProtectedRoute(request)) {
            await auth.protect();
        }

        const isAdminArea = isAdminSubdomain || url.pathname.startsWith('/admin');

        // Admin auth routes that are always public (no auth required)
        const publicAdminPaths = [
            '/admin/login',
            '/admin/setup',
            '/admin/recover',
            '/admin/pending',
            '/admin/logout',
            '/admin/invite/accept',
        ];
        // Note: targetPath is the internal rewritten path (e.g. /admin/login)
        const isPublicAdminRoute = publicAdminPaths.some(p => targetPath.startsWith(p));

        if (isAdminArea && !isPublicAdminRoute) {
            const authObj = await auth();

            if (!authObj.userId) {
                // Not signed in — redirect to admin login
                // On subdomain: redirect to /login (which will be rewritten to /admin/login internally)
                // On main domain: redirect to /admin/login
                const loginUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', request.url);
                return NextResponse.redirect(loginUrl);
            }

            // NOTE: Role enforcement is NOT done here.
            // The role is stored in the admin_profiles DB table, which can't be
            // accessed from Edge middleware. Role checks happen in:
            //   1. Admin layout (client-side via /api/admin/me)
            //   2. Server actions / API routes (via getAdminProfile / isSuperAdmin)
        }

        // If a signed-in user visits the login page, redirect them to the dashboard.
        // The dashboard/layout will handle any further role-based redirection.
        if (isPublicAdminRoute && targetPath.startsWith('/admin/login')) {
            const authObj = await auth();
            if (authObj.userId) {
                const dashboardUrl = new URL(isAdminSubdomain ? '/' : '/admin', request.url);
                return NextResponse.redirect(dashboardUrl);
            }
        }

        // 4. Final Rewrite/Next
        if (targetPath !== url.pathname) {
            const rewriteUrl = new URL(targetPath, request.url);
            return NextResponse.rewrite(rewriteUrl, {
                request: { headers: requestHeaders },
            });
        }

        return NextResponse.next({
            request: { headers: requestHeaders },
        });

    } catch (error) {
        console.error('[Middleware] Unhandled error:', error);

        const url = request.nextUrl;
        const hostname = request.headers.get('host') || '';
        const isAdminSubdomain = hostname.startsWith('admin.');

        // API routes: always return 500 on middleware error
        if (url.pathname.startsWith('/api')) {
            return new NextResponse(
                JSON.stringify({ error: 'Internal middleware error' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Admin area routes: redirect to login on error (security requirement)
        if (isAdminSubdomain || url.pathname.startsWith('/admin')) {
            const loginUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Store routes (e.g. /categories/*, /products/*): let the request pass through
        // so Next.js can render the page normally — don't block on auth middleware errors
        return NextResponse.next();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
