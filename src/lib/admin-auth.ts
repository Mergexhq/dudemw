import { auth } from '@clerk/nextjs/server'
import { prisma } from './db'
import crypto from 'crypto'

// Admin role hierarchy
export type AdminRole = 'super_admin' | 'admin' | 'manager' | 'staff'

export interface AdminProfile {
  id: string
  user_id: string
  role: AdminRole
  is_active: boolean
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  name?: string | null
  full_name?: string | null
  avatar_url?: string | null
  last_login?: string | null
}

export interface AdminSettings {
  id: string
  setup_completed: boolean
  recovery_key_hash: string | null
  created_at: string
  updated_at: string
  singleton_guard: boolean
}

/**
 * Generate a secure recovery key.
 * Returns a 32-character alphanumeric key formatted as XXXX-XXXX-...
 */
export function generateRecoveryKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const length = 32
  const randomBytes = crypto.randomBytes(length)

  let key = ''
  for (let i = 0; i < length; i++) {
    key += chars[randomBytes[i] % chars.length]
  }

  return key.match(/.{1,4}/g)?.join('-') || key
}

/** Hash a recovery key using SHA-256 */
export function hashRecoveryKey(key: string): string {
  return crypto
    .createHash('sha256')
    .update(key.replace(/-/g, ''))
    .digest('hex')
}

/** Verify a recovery key against its hash */
export function verifyRecoveryKey(key: string, hash: string): boolean {
  return hashRecoveryKey(key) === hash
}

/** Check if admin initial setup has been completed */
export async function isSetupCompleted(): Promise<boolean> {
  try {
    const settings = await prisma.admin_settings.findFirst({
      select: { setup_completed: true },
    })
    return settings?.setup_completed ?? false
  } catch (error) {
    console.error('Error checking setup status:', error)
    return false
  }
}

/**
 * Get admin profile for a user by their Clerk userId.
 * The admin_profiles table has a `user_id` column that stores the Clerk userId.
 */
export async function getAdminProfile(userId: string): Promise<AdminProfile | null> {
  try {
    const profile = await prisma.admin_profiles.findUnique({
      where: { user_id: userId },
    })

    if (!profile) return null

    return {
      id: profile.id,
      user_id: profile.user_id,
      role: profile.role as AdminRole,
      is_active: profile.is_active ?? false,
      approved_by: profile.approved_by ?? null,
      approved_at: profile.approved_at?.toISOString() ?? null,
      created_at: profile.created_at?.toISOString() ?? '',
      updated_at: profile.updated_at?.toISOString() ?? '',
      name: profile.name ?? null,
      full_name: profile.full_name ?? null,
      avatar_url: profile.avatar_url ?? null,
      last_login: profile.last_login?.toISOString() ?? null,
    }
  } catch (error) {
    console.error('[getAdminProfile] Error:', error)
    return null
  }
}

/** Check if user is an active admin */
export async function isActiveAdmin(userId: string): Promise<boolean> {
  const profile = await getAdminProfile(userId)
  return profile?.is_active === true
}

/** Check if user is a super admin */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const profile = await getAdminProfile(userId)
  return profile?.role === 'super_admin' && profile?.is_active === true
}

/**
 * Get the current Clerk user ID and their admin profile.
 * Use in server components/actions to verify admin access.
 */
export async function getCurrentAdmin(): Promise<{
  userId: string
  profile: AdminProfile | null
} | null> {
  try {
    const { userId } = await auth()
    if (!userId) return null

    const profile = await getAdminProfile(userId)
    return { userId, profile }
  } catch (error) {
    console.error('Error getting current admin:', error)
    return null
  }
}

/**
 * Create an admin profile row for an existing Clerk user.
 * NOTE: User accounts are created via Clerk — this only creates the DB profile.
 */
export async function createAdminProfile(
  clerkUserId: string,
  role: AdminRole,
  createdBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.admin_profiles.create({
      data: {
        user_id: clerkUserId,
        role,
        is_active: role === 'super_admin',
        approved_by: role === 'super_admin' ? clerkUserId : createdBy,
        approved_at: role === 'super_admin' ? new Date() : null,
      },
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error creating admin profile:', error)
    return { success: false, error: error.message || 'Failed to create admin profile' }
  }
}

/** Approve an admin user */
export async function approveAdminUser(
  userId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.admin_profiles.update({
      where: { user_id: userId },
      data: {
        is_active: true,
        approved_by: approvedBy,
        approved_at: new Date(),
      },
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error approving admin:', error)
    return { success: false, error: error.message }
  }
}

/** Revoke admin access */
export async function revokeAdminAccess(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.admin_profiles.update({
      where: { user_id: userId },
      data: {
        is_active: false,
        deleted_at: new Date(),
      },
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error revoking admin access:', error)
    return { success: false, error: error.message }
  }
}

/** Get admin settings */
export async function getAdminSettings(): Promise<AdminSettings | null> {
  try {
    const settings = await prisma.admin_settings.findFirst()
    if (!settings) return null

    return {
      id: settings.id,
      setup_completed: settings.setup_completed ?? false,
      recovery_key_hash: settings.recovery_key_hash ?? null,
      created_at: settings.created_at?.toISOString() ?? '',
      updated_at: settings.updated_at?.toISOString() ?? '',
      singleton_guard: settings.singleton_guard,
    }
  } catch (error) {
    console.error('Error in getAdminSettings:', error)
    return null
  }
}

/** Update admin settings */
export async function updateAdminSettings(
  updates: Partial<Omit<AdminSettings, 'id' | 'singleton_guard'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await prisma.admin_settings.findFirst({ select: { id: true } })
    if (!existing) return { success: false, error: 'Admin settings not found' }

    await prisma.admin_settings.update({
      where: { id: existing.id },
      data: {
        ...(updates.setup_completed !== undefined && { setup_completed: updates.setup_completed }),
        ...(updates.recovery_key_hash !== undefined && { recovery_key_hash: updates.recovery_key_hash }),
      },
    })
    return { success: true }
  } catch (error: any) {
    console.error('Error in updateAdminSettings:', error)
    return { success: false, error: error.message }
  }
}

/** Verify the admin setup key from env */
export function verifySetupKey(inputKey: string): boolean {
  const setupKey = process.env.ADMIN_SETUP_KEY
  if (!setupKey) {
    console.error('ADMIN_SETUP_KEY not configured')
    return false
  }
  return inputKey === setupKey
}

/** Role hierarchy check */
export function hasRolePermission(userRole: AdminRole, targetRole: AdminRole): boolean {
  const hierarchy: Record<AdminRole, number> = {
    super_admin: 4,
    admin: 3,
    manager: 2,
    staff: 1,
  }
  return hierarchy[userRole] >= hierarchy[targetRole]
}
