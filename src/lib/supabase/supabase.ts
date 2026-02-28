/**
 * MIGRATED: This file previously provided Supabase clients.
 * Now re-exports the Prisma singleton so all existing imports continue to work.
 *
 * All services should be gradually updated to import from '@/lib/db' directly.
 */
export { prisma as supabase, prisma as supabaseAdmin } from '../db'

// For places that call createClient() — return the prisma singleton
export { prisma as createClient } from '../db'
