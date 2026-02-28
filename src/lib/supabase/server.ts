/**
 * MIGRATED: Previously returned a Supabase server client with Clerk JWT.
 * Now returns the Prisma client singleton — all DB access goes through Prisma.
 */
import { prisma } from '../db'

export async function createServerSupabase() {
  return prisma
}

export { prisma }
