import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isStoreProtectedRoute = createRouteMatcher(['/profile(.*)', '/wishlist(.*)']);
const isAdminRoute = createRouteMatcher(['/admin(.*)']);

export default clerkMiddleware(async (auth, request) => {
    const url = request.nextUrl;
    const hostname = request.headers.get("host") || "";

    // 1. Subdomain routing for admin
    const isAdminSubdomain = hostname.startsWith("admin.");
    let targetPath = url.pathname;

    if (isAdminSubdomain && !url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api')) {
        targetPath = `/admin${url.pathname}`;
    }

    // 2. Auth Protection
    // We only check store routes on the original request because they don't get rewritten
    if (isStoreProtectedRoute(request)) {
        await auth.protect();
    }

    const isAdminArea = isAdminSubdomain || url.pathname.startsWith('/admin');
    const isLoginOrSetup = targetPath === '/admin/login' || targetPath === '/admin/setup';

    if (isAdminArea && !isLoginOrSetup) {
        const authObj = await auth();
        if (!authObj.userId) {
            // If it's a subdomain, redirecting to /admin/login means redirecting to /login on the admin subdomain
            const loginUrl = new URL(isAdminSubdomain ? '/login' : '/admin/login', request.url);
            return NextResponse.redirect(loginUrl);
        }

        // Uncomment to enforce admin role via public metadata
        // if (authObj.sessionClaims?.metadata?.role !== 'admin') {
        //     return NextResponse.redirect(new URL('/', request.url));
        // }
    }

    // 3. Rewrite if subdomain
    if (targetPath !== url.pathname) {
        return NextResponse.rewrite(new URL(targetPath, request.url));
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
