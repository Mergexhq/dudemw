import { createServerSupabase } from './supabase/server'
import { createClient } from '@supabase/supabase-js'
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
 * Generate a secure recovery key
 * Returns a 32-character alphanumeric key
 */
export function generateRecoveryKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed ambiguous chars
  const length = 32
  const randomBytes = crypto.randomBytes(length)

  let key = ''
  for (let i = 0; i < length; i++) {
    key += chars[randomBytes[i] % chars.length]
  }

  // Format as XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  return key.match(/.{1,4}/g)?.join('-') || key
}

/**
 * Hash a recovery key using SHA-256
 */
export function hashRecoveryKey(key: string): string {
  return crypto
    .createHash('sha256')
    .update(key.replace(/-/g, '')) // Remove dashes before hashing
    .digest('hex')
}

/**
 * Verify a recovery key against its hash
 */
export function verifyRecoveryKey(key: string, hash: string): boolean {
  const inputHash = hashRecoveryKey(key)
  return inputHash === hash
}

/**
 * Check if admin setup is completed
 */
export async function isSetupCompleted(): Promise<boolean> {
  try {
    const supabase = await createServerSupabase()

    const { data, error } = await supabase
      .from('admin_settings' as any)
      .select('setup_completed')
      .single()

    if (error) {
      console.error('Error checking setup status:', error)
      return false
    }

    return (data as any)?.setup_completed || false
  } catch (error) {
    console.error('Error in isSetupCompleted:', error)
    return false
  }
}

/**
 * Get admin profile for a user
 * Uses service role to bypass RLS for reliable profile fetching
 */
export async function getAdminProfile(userId: string): Promise<AdminProfile | null> {
  try {
    console.log('[getAdminProfile] ========== DEBUG START ==========')
    console.log('[getAdminProfile] Fetching profile for user:', userId)

    // Use service role client to bypass RLS policies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    // Debug: Log environment variable status
    console.log('[getAdminProfile] Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      supabaseUrlPrefix: supabaseUrl?.substring(0, 30) + '...',
      hasServiceRoleKey: !!serviceRoleKey,
      serviceRoleKeyLength: serviceRoleKey?.length || 0,
      serviceRoleKeyPrefix: serviceRoleKey?.substring(0, 20) + '...',
      nodeEnv: process.env.NODE_ENV
    })

    if (!supabaseUrl) {
      console.error('[getAdminProfile] NEXT_PUBLIC_SUPABASE_URL not configured!')
      return null
    }

    if (!serviceRoleKey) {
      console.error('[getAdminProfile] SUPABASE_SERVICE_ROLE_KEY not configured!')
      return null
    }

    // Check if key looks like a JWT
    if (!serviceRoleKey.startsWith('eyJ')) {
      console.error('[getAdminProfile] Service role key does not look like a JWT token!')
      return null
    }

    console.log('[getAdminProfile] Creating Supabase admin client...')
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    console.log('[getAdminProfile] Executing query for user_id:', userId)
    const { data, error } = await supabaseAdmin
      .from('admin_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      console.error('[getAdminProfile] Query error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return null
    }

    if (!data) {
      console.log('[getAdminProfile] No data returned for user:', userId)
      return null
    }

    console.log('[getAdminProfile] Profile found:', {
      id: data.id,
      user_id: data.user_id,
      role: data.role,
      is_active: data.is_active
    })
    console.log('[getAdminProfile] ========== DEBUG END ==========')
    return data as AdminProfile
  } catch (error: any) {
    console.error('[getAdminProfile] Exception caught:', {
      name: error?.name,
      message: error?.message,
      stack: error?.stack?.substring(0, 500)
    })
    return null
  }
}

/**
 * Check if user is an active admin
 */
export async function isActiveAdmin(userId: string): Promise<boolean> {
  const profile = await getAdminProfile(userId)
  return profile?.is_active === true
}

/**
 * Check if user is a super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const profile = await getAdminProfile(userId)
  return profile?.role === 'super_admin' && profile?.is_active === true
}

/**
 * Get current admin user
 */
export async function getCurrentAdmin(): Promise<{
  user: any
  profile: AdminProfile | null
} | null> {
  try {
    const supabase = await createServerSupabase()

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    const profile = await getAdminProfile(user.id)

    return { user, profile }
  } catch (error) {
    console.error('Error getting current admin:', error)
    return null
  }
}

/**
 * Create admin user using service role
 * This bypasses RLS policies
 */
export async function createAdminUser(
  email: string,
  password: string,
  role: AdminRole,
  createdBy: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceRoleKey) {
      return { success: false, error: 'Service role key not configured' }
    }

    // Create Supabase admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        is_admin: true
      }
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return { success: false, error: authError?.message || 'Failed to create user' }
    }

    // Create admin profile
    const { error: profileError } = await supabaseAdmin
      .from('admin_profiles')
      .insert({
        user_id: authData.user.id,
        role,
        is_active: role === 'super_admin' ? true : false, // Super admin is active immediately, others require approval
        approved_by: role === 'super_admin' ? authData.user.id : createdBy,
        approved_at: role === 'super_admin' ? new Date().toISOString() : null
      })

    if (profileError) {
      console.error('Error creating admin profile:', profileError)
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return { success: false, error: 'Failed to create admin profile' }
    }

    return { success: true, userId: authData.user.id }
  } catch (error: any) {
    console.error('Error in createAdminUser:', error)
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Approve admin user
 */
export async function approveAdminUser(
  userId: string,
  approvedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { error } = await supabaseAdmin
      .from('admin_profiles')
      .update({
        is_active: true,
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error approving admin:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in approveAdminUser:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Revoke admin access
 */
export async function revokeAdminAccess(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { error } = await supabaseAdmin
      .from('admin_profiles')
      .update({ is_active: false })
      .eq('user_id', userId)

    if (error) {
      console.error('Error revoking admin access:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in revokeAdminAccess:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get admin settings
 */
export async function getAdminSettings(): Promise<AdminSettings | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('*')
      .single()

    if (error) {
      console.error('Error getting admin settings:', error)
      return null
    }

    return data as AdminSettings
  } catch (error) {
    console.error('Error in getAdminSettings:', error)
    return null
  }
}

/**
 * Update admin settings
 */
export async function updateAdminSettings(
  updates: Partial<AdminSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

    const { error } = await supabaseAdmin
      .from('admin_settings')
      .update(updates)
      .eq('id', (await getAdminSettings())?.id)

    if (error) {
      console.error('Error updating admin settings:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in updateAdminSettings:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verify setup key
 */
export function verifySetupKey(inputKey: string): boolean {
  const setupKey = process.env.ADMIN_SETUP_KEY

  if (!setupKey) {
    console.error('ADMIN_SETUP_KEY not configured')
    return false
  }

  return inputKey === setupKey
}

/**
 * Role hierarchy check
 * Returns true if userRole has permission over targetRole
 */
export function hasRolePermission(userRole: AdminRole, targetRole: AdminRole): boolean {
  const hierarchy: Record<AdminRole, number> = {
    super_admin: 4,
    admin: 3,
    manager: 2,
    staff: 1
  }

  return hierarchy[userRole] >= hierarchy[targetRole]
}
