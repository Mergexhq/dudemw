import { NextRequest, NextResponse } from 'next/server'

/**
 * Auth callback route is no longer needed with Clerk.
 * Clerk handles OAuth callbacks internally via its own redirect URIs.
 * This route is kept as a no-op redirect for backward compatibility.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get('next') ?? '/'
  // Redirect to home or intended destination — Clerk has already handled session creation
  return NextResponse.redirect(`${origin}${next}`)
}