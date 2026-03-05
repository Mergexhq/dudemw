import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isStoreProtectedRoute = createRouteMatcher(['/wishlist(.*)']);

export default clerkMiddleware(async (auth, request) => {
    try {
        const url = request.nextUrl;
        const hostname = request.headers.get("host") || "";

        // 1. Subdomain routing for admin
        const isAdminSubdomain = hostname.startsWith("admin.");
        let targetPath = url.pathname;

        if (isAdminSubdomain && !url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api')) {
            targetPath = `/admin${url.pathname}`;
        }

        // Build request headers with x-pathname so server components can read it via headers()
        // IMPORTANT: Must be in REQUEST headers (not response headers) for headers() to work
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-pathname', targetPath);

        // 2. Auth Protection
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
        const isPublicAdminRoute = publicAdminPaths.some(p => targetPath.startsWith(p));

        if (isAdminArea && !isPublicAdminRoute) {
            const authObj = await auth();

            if (!authObj.userId) {
                // Not signed in — redirect to admin login
                const loginUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', request.url);
                return NextResponse.redirect(loginUrl);
            }

            // Enforce admin role via Clerk publicMetadata
            const role = (authObj.sessionClaims?.publicMetadata as any)?.role;
            const adminRoles = ['super_admin', 'admin', 'manager', 'editor', 'staff'];

            // If user has a role set but it's not an admin role, deny access
            if (role && !adminRoles.includes(role)) {
                const loginUrl = new URL('/admin/login', request.url);
                return NextResponse.redirect(loginUrl);
            }
            // Note: if role is undefined (first-time setup or new user), we allow through
            // The admin layout will handle further validation via DB
        }

        // 3. Rewrite if subdomain — forward x-pathname in REQUEST headers so layout.tsx detects admin routes
        if (targetPath !== url.pathname) {
            const rewriteUrl = new URL(targetPath, request.url);
            // Pass requestHeaders so server components receive x-pathname
            return NextResponse.rewrite(rewriteUrl, {
                request: { headers: requestHeaders },
            });
        }

        // Always set x-pathname for layout.tsx to detect current route via headers()
        return NextResponse.next({
            request: { headers: requestHeaders },
        });

    } catch (error) {
        // Bug fix: catch any Clerk/middleware errors to prevent 500 on admin subdomain
        console.error('[Middleware] Error:', error);
        return NextResponse.next();
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
