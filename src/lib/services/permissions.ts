import { prisma } from '@/lib/db'
import { getAdminProfile } from '../admin-auth'

/**
 * Permission Service
 * Provides permission checking functionality for RBAC system
 */

const ROLE_PERMISSIONS: Record<string, string[]> = {
    admin: ['*'],       // Customize these roles based on your application needs
    manager: ['*'],     // Defaulting to all permissions as a fallback since the
    staff: ['*']        // role_permissions database table has not been created
}

/** Check if user has a specific permission */
export async function hasPermission(userId: string, permission: string): Promise<boolean> {
    try {
        const profile = await getAdminProfile(userId)
        if (!profile || !profile.is_active) return false
        if (profile.role === 'super_admin') return true

        const perms = ROLE_PERMISSIONS[profile.role] || []
        return perms.includes('*') || perms.includes(permission)
    } catch (error) {
        console.error('Error in hasPermission:', error)
        return false
    }
}

/** Get all permissions for a user */
export async function getUserPermissions(userId: string): Promise<string[]> {
    try {
        const profile = await getAdminProfile(userId)
        if (!profile || !profile.is_active) return []
        if (profile.role === 'super_admin') return ['*']

        return ROLE_PERMISSIONS[profile.role] || []
    } catch (error) {
        console.error('Error in getUserPermissions:', error)
        return []
    }
}

/** Check if user has ALL of the specified permissions (AND logic) */
export async function hasAllPermissions(userId: string, permissions: string[]): Promise<boolean> {
    try {
        const profile = await getAdminProfile(userId)
        if (!profile || !profile.is_active) return false
        if (profile.role === 'super_admin') return true

        for (const perm of permissions) {
            if (!(await hasPermission(userId, perm))) return false
        }
        return true
    } catch (error) {
        console.error('Error in hasAllPermissions:', error)
        return false
    }
}

/** Check if user has ANY of the specified permissions (OR logic) */
export async function hasAnyPermission(userId: string, permissions: string[]): Promise<boolean> {
    try {
        const profile = await getAdminProfile(userId)
        if (!profile || !profile.is_active) return false
        if (profile.role === 'super_admin') return true

        for (const perm of permissions) {
            if (await hasPermission(userId, perm)) return true
        }
        return false
    } catch (error) {
        console.error('Error in hasAnyPermission:', error)
        return false
    }
}

/** Get permissions by resource */
export async function getResourcePermissions(resource: string): Promise<string[]> {
    try {
        const perms = await prisma.permissions.findMany({
            where: { resource } as any,
            select: { key: true },
        })
        return perms.map((p: any) => p.key)
    } catch (error) {
        console.error('Error in getResourcePermissions:', error)
        return []
    }
}
