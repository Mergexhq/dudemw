/**
 * MIGRATED: This was the browser-side Supabase client.
 * Client-side auth is now handled by Clerk.
 * DB queries must use server-side API routes — no direct DB access from the browser.
 *
 * Keeping this file to avoid breaking legacy imports.
 * The `supabase` export is a no-op stub; consumers should migrate to API routes.
 */

// NOTE: Supabase still used for Storage (Cloudinary handles new uploads).
// If you need legacy calls, the original URL/key are still in .env.

export function createClient() {
  // Return a minimal stub so TypeScript doesn't break on legacy imports.
  // Any actual queries need to move to Server Actions / API routes.
  console.warn(
    '[DEPRECATED] createClient() from supabase/client.ts — migrate to Server Actions using Prisma'
  )
  return null as any
}

export const supabase = createClient()
