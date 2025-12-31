import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Custom hook to check user permissions
 * Returns permission status and loading state
 */
export function usePermission(permission: string) {
    const [hasPermission, setHasPermission] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        checkPermission()
    }, [permission])

    const checkPermission = async () => {
        try {
            setIsLoading(true)
            const supabase = createClient()

            // Get current user
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setHasPermission(false)
                return
            }

            // Check permission via API (uses server-side permission service)
            const response = await fetch(`/api/admin/permissions/check?permission=${permission}`)
            const data = await response.json()

            setHasPermission(data.hasPermission || false)
        } catch (error) {
            console.error('Error checking permission:', error)
            setHasPermission(false)
        } finally {
            setIsLoading(false)
        }
    }

    return { hasPermission, isLoading }
}

/**
 * Hook to get all user permissions
 */
export function useUserPermissions() {
    const [permissions, setPermissions] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchPermissions()
    }, [])

    const fetchPermissions = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/admin/permissions')
            const data = await response.json()

            setPermissions(data.permissions || [])
        } catch (error) {
            console.error('Error fetching permissions:', error)
            setPermissions([])
        } finally {
            setIsLoading(false)
        }
    }

    const hasPermission = (permission: string) => {
        // Super admin has all permissions
        if (permissions.includes('*')) return true
        return permissions.includes(permission)
    }

    const hasAnyPermission = (perms: string[]) => {
        if (permissions.includes('*')) return true
        return perms.some(p => permissions.includes(p))
    }

    const hasAllPermissions = (perms: string[]) => {
        if (permissions.includes('*')) return true
        return perms.every(p => permissions.includes(p))
    }

    return {
        permissions,
        isLoading,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions
    }
}
