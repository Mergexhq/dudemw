/**
 * MIGRATED: Previously a public Supabase client for static data fetching.
 * Now returns the Prisma singleton for server-side use.
 */
import { prisma } from '../db'

export function createPublicServerSupabase() {
    return prisma
}

export { prisma }
