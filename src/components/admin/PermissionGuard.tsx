'use client'

import { ReactNode } from 'react'
import { useUserPermissions } from '@/lib/hooks/usePermission'

interface PermissionGuardProps {
    permission?: string
    permissions?: string[]
    requireAll?: boolean // If true, requires ALL permissions. If false, requires ANY permission
    fallback?: ReactNode
    children: ReactNode
}

/**
 * PermissionGuard Component
 * Conditionally renders children based on user permissions
 * 
 * @example
 * // Single permission
 * <PermissionGuard permission="product.create">
 *   <Button>Create Product</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Multiple permissions (ANY)
 * <PermissionGuard permissions={['product.edit', 'product.delete']}>
 *   <Button>Edit/Delete</Button>
 * </PermissionGuard>
 * 
 * @example
 * // Multiple permissions (ALL)
 * <PermissionGuard permissions={['product.edit', 'product.publish']} requireAll>
 *   <Button>Edit & Publish</Button>
 * </PermissionGuard>
 */
export function PermissionGuard({
    permission,
    permissions,
    requireAll = false,
    fallback = null,
    children
}: PermissionGuardProps) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useUserPermissions()

    // Don't render anything while loading
    if (isLoading) {
        return <>{fallback}</>
    }

    // Single permission check
    if (permission) {
        return hasPermission(permission) ? <>{children}</> : <>{fallback}</>
    }

    // Multiple permissions check
    if (permissions && permissions.length > 0) {
        const hasAccess = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions)

        return hasAccess ? <>{children}</> : <>{fallback}</>
    }

    // No permission specified, don't render
    return <>{fallback}</>
}

/**
 * Inverse PermissionGuard
 * Renders children when user DOES NOT have permission
 */
export function PermissionDeny({
    permission,
    permissions,
    requireAll = false,
    children
}: Omit<PermissionGuardProps, 'fallback'>) {
    const { hasPermission, hasAnyPermission, hasAllPermissions, isLoading } = useUserPermissions()

    if (isLoading) {
        return null
    }

    // Single permission check (inverse)
    if (permission) {
        return !hasPermission(permission) ? <>{children}</> : null
    }

    // Multiple permissions check (inverse)
    if (permissions && permissions.length > 0) {
        const hasAccess = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions)

        return !hasAccess ? <>{children}</> : null
    }

    return null
}
