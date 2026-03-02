'use client'

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs'

/**
 * This page handles the OAuth SSO callback from Clerk.
 * Clerk redirects back here after the user authenticates with Google (or another provider).
 * The AuthenticateWithRedirectCallback component completes the sign-in flow automatically.
 */
export default function SSOCallbackPage() {
    return <AuthenticateWithRedirectCallback />
}
