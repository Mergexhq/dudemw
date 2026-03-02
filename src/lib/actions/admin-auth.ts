'use server'

import { auth } from '@clerk/nextjs/server'
import {
  isSetupCompleted,
  getAdminProfile,
  createAdminUser,
  verifySetupKey,
  generateRecoveryKey,
  hashRecoveryKey,
  verifyRecoveryKey,
  getAdminSettings,
  updateAdminSettings,
  approveAdminUser as approveAdminUserUtil,
  revokeAdminAccess as revokeAdminAccessUtil,
  isSuperAdmin,
  AdminRole
} from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

/**
 * Admin Login Action — with Clerk, authentication is handled by Clerk's SignIn UI.
 * This action now just validates the admin profile exists and is active.
 */
export async function adminLoginAction(email?: string, password?: string) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'Not authenticated. Please sign in via Clerk.' }
    }

    const adminProfile = await getAdminProfile(userId)
    if (!adminProfile) {
      return { success: false, error: 'Unauthorized - No admin profile' }
    }

    if (!adminProfile.is_active) {
      return { success: false, error: 'Access not approved', pending: true }
    }

    return { success: true, role: adminProfile.role, userId }
  } catch (error: any) {
    console.error('[Admin Login] Exception caught:', error)
    return { success: false, error: 'Login failed: ' + error.message }
  }
}

/**
 * Admin Setup Action (First-Time Only)
 */
export async function adminSetupAction(email: string, password: string, setupKey: string) {
  try {
    const setupCompleted = await isSetupCompleted()
    if (setupCompleted) return { success: false, error: 'Setup has already been completed.' }
    if (!verifySetupKey(setupKey)) return { success: false, error: 'Invalid setup key.' }

    // With Clerk migration: user must be signed in via Clerk already.
    // We use their Clerk userId to create the admin profile.
    const { userId } = await auth()
    if (!userId) {
      return { success: false, error: 'You must be signed in via Clerk before completing setup. Please sign in at /admin/login first.' }
    }

    const recoveryKey = generateRecoveryKey()
    const recoveryKeyHash = hashRecoveryKey(recoveryKey)

    // createAdminUser is an alias for createAdminProfile(clerkUserId, role, createdBy)
    const result = await createAdminUser(userId, 'super_admin', userId)
    if (!result.success) return { success: false, error: result.error || 'Failed to create super admin.' }

    await updateAdminSettings({ setup_completed: true, recovery_key_hash: recoveryKeyHash })

    return { success: true, recoveryKey, userId }
  } catch (error: any) {
    console.error('Admin setup error:', error)
    return { success: false, error: 'An unexpected error occurred during setup.' }
  }
}


/**
 * Admin Recovery — with Clerk, this verifies the recovery key and returns a link.
 * Actual password reset is handled via Clerk dashboard.
 */
export async function adminRecoveryAction(email: string, recoveryKey: string) {
  try {
    const settings = await getAdminSettings()
    if (!settings?.recovery_key_hash) return { success: false, error: 'Recovery not configured.' }
    if (!verifyRecoveryKey(recoveryKey, settings.recovery_key_hash)) return { success: false, error: 'Invalid recovery key.' }

    // With Clerk, password reset is managed by Clerk — redirect to Clerk password reset
    return {
      success: true,
      message: 'Recovery key verified. Please use the Clerk dashboard or sign-in page to reset your password.',
      resetLink: `${process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in'}?redirect_url=/admin`
    }
  } catch (error: any) {
    console.error('Admin recovery error:', error)
    return { success: false, error: 'An unexpected error occurred during recovery.' }
  }
}

/**
 * Create Admin User Action
 */
export async function createAdminUserAction(email: string, role: AdminRole, temporaryPassword: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Not authenticated.' }

    const isSuperAdminUser = await isSuperAdmin(userId)
    if (!isSuperAdminUser) return { success: false, error: 'Only super admins can create admin users.' }

    const result = await (createAdminUser as any)(email, temporaryPassword, role, userId)
    if (!result.success) return { success: false, error: result.error }

    revalidatePath('/admin/settings/users')
    return { success: true, userId: (result as any).userId, message: 'Admin user created successfully. They must be approved before accessing the system.' }
  } catch (error: any) {
    console.error('Create admin user error:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

/**
 * Approve Admin User Action
 */
export async function approveAdminAction(targetUserId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Not authenticated.' }

    const isSuperAdminUser = await isSuperAdmin(userId)
    if (!isSuperAdminUser) return { success: false, error: 'Only super admins can approve admin users.' }

    const result = await approveAdminUserUtil(targetUserId, userId)
    if (!result.success) return { success: false, error: result.error }

    revalidatePath('/admin/settings/users')
    return { success: true, message: 'Admin user approved successfully.' }
  } catch (error: any) {
    console.error('Approve admin error:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

/**
 * Revoke Admin Access Action
 */
export async function revokeAdminAction(targetUserId: string) {
  try {
    const { userId } = await auth()
    if (!userId) return { success: false, error: 'Not authenticated.' }

    const isSuperAdminUser = await isSuperAdmin(userId)
    if (!isSuperAdminUser) return { success: false, error: 'Only super admins can revoke admin access.' }

    if (userId === targetUserId) return { success: false, error: 'You cannot revoke your own access.' }

    const result = await revokeAdminAccessUtil(targetUserId)
    if (!result.success) return { success: false, error: result.error }

    revalidatePath('/admin/settings/users')
    return { success: true, message: 'Admin access revoked successfully.' }
  } catch (error: any) {
    console.error('Revoke admin error:', error)
    return { success: false, error: 'An unexpected error occurred.' }
  }
}

/**
 * Check Setup Status Action
 */
export async function checkSetupStatusAction() {
  try {
    const completed = await isSetupCompleted()
    return { success: true, setupCompleted: completed }
  } catch (error) {
    return { success: false, setupCompleted: false }
  }
}
