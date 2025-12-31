import { createServerSupabase } from '../supabase/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminProfile } from '../admin-auth'

/**
 * Permission Service
 * Provides permission checking functionality for RBAC system
 */

/**
 * Check if user has a specific permission
 * Super admins have all permissions (wildcard *)
 */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
        // Get admin profile
        const profile = await getAdminProfile(userId)

        if (!profile || !profile.is_active) {
            return false
        }

        // Super admins have all permissions
        if (profile.role === 'super_admin') {
            return true
        }

        // Check if user's role has the permission
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { data, error } = await supabaseAdmin
            .from('role_permissions')
            .select(`
        permission_id,
        permissions!inner(key)
      `)
            .eq('role', profile.role)

        if (error) {
            console.error('Error checking permission:', error)
            return false
        }

        // Check if permission exists in user's role permissions
        return data?.some((rp: any) => rp.permissions.key === permission) || false
    } catch (error) {
        console.error('Error in hasPermission:', error)
        return false
    }
}

/**
 * Get all permissions for a user
 * Returns array of permission keys
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
    try {
        const profile = await getAdminProfile(userId)

        if (!profile || !profile.is_active) {
            return []
        }

        // Super admins have all permissions
        if (profile.role === 'super_admin') {
            return ['*'] // Wildcard indicates all permissions
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { data, error } = await supabaseAdmin
            .from('role_permissions')
            .select(`
        permissions!inner(key)
      `)
            .eq('role', profile.role)

        if (error) {
            console.error('Error getting user permissions:', error)
            return []
        }

        return data?.map((rp: any) => rp.permissions.key) || []
    } catch (error) {
        console.error('Error in getUserPermissions:', error)
        return []
    }
}

/**
 * Check if user has ALL of the specified permissions (AND logic)
 */
export async function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    try {
        const profile = await getAdminProfile(userId)

        if (!profile || !profile.is_active) {
            return false
        }

        // Super admins have all permissions
        if (profile.role === 'super_admin') {
            return true
        }

        // Check each permission
        for (const permission of permissions) {
            const has = await hasPermission(userId, permission)
            if (!has) {
                return false
            }
        }

        return true
    } catch (error) {
        console.error('Error in hasAllPermissions:', error)
        return false
    }
}

/**
 * Check if user has ANY of the specified permissions (OR logic)
 */
export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    try {
        const profile = await getAdminProfile(userId)

        if (!profile || !profile.is_active) {
            return false
        }

        // Super admins have all permissions
        if (profile.role === 'super_admin') {
            return true
        }

        // Check each permission
        for (const permission of permissions) {
            const has = await hasPermission(userId, permission)
            if (has) {
                return true
            }
        }

        return false
    } catch (error) {
        console.error('Error in hasAnyPermission:', error)
        return false
    }
}

/**
 * Get permissions by resource
 * Returns all permissions for a specific resource (e.g., 'product')
 */
export async function getResourcePermissions(resource: string): Promise<string[]> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { data, error } = await supabaseAdmin
            .from('permissions')
            .select('key')
            .eq('resource', resource)

        if (error) {
            console.error('Error getting resource permissions:', error)
            return []
        }

        return data?.map(p => p.key) || []
    } catch (error) {
        console.error('Error in getResourcePermissions:', error)
        return []
    }
}
