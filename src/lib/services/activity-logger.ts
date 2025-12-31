import { createClient } from '@supabase/supabase-js'

/**
 * Activity Logger Service
 * Logs all admin actions for audit trail
 */

export interface ActivityLogData {
    adminUserId: string
    action: string
    entityType?: string
    entityId?: string
    metadata?: Record<string, any>
    ipAddress?: string
    userAgent?: string
}

/**
 * Log an admin activity
 */
export async function logActivity(data: ActivityLogData): Promise<void> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

        if (!serviceRoleKey) {
            console.warn('[ActivityLogger] Service role key not configured, skipping log')
            return
        }

        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { error } = await supabaseAdmin
            .from('admin_activity_logs')
            .insert({
                admin_user_id: data.adminUserId,
                action: data.action,
                entity_type: data.entityType,
                entity_id: data.entityId,
                metadata: data.metadata,
                ip_address: data.ipAddress,
                user_agent: data.userAgent
            })

        if (error) {
            console.error('[ActivityLogger] Error logging activity:', error)
        }
    } catch (error) {
        console.error('[ActivityLogger] Exception in logActivity:', error)
    }
}

/**
 * Get activity logs for a specific admin user
 */
export async function getUserActivityLogs(
    userId: string,
    limit: number = 50
): Promise<any[]> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { data, error } = await supabaseAdmin
            .from('admin_activity_logs')
            .select('*')
            .eq('admin_user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('[ActivityLogger] Error fetching user logs:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('[ActivityLogger] Exception in getUserActivityLogs:', error)
        return []
    }
}

/**
 * Get recent activity logs (all users)
 */
export async function getRecentActivityLogs(limit: number = 100): Promise<any[]> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { data, error } = await supabaseAdmin
            .from('admin_activity_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('[ActivityLogger] Error fetching recent logs:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('[ActivityLogger] Exception in getRecentActivityLogs:', error)
        return []
    }
}

/**
 * Get activity logs by action
 */
export async function getActivityLogsByAction(
    action: string,
    limit: number = 50
): Promise<any[]> {
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey)

        const { data, error } = await supabaseAdmin
            .from('admin_activity_logs')
            .select('*')
            .eq('action', action)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('[ActivityLogger] Error fetching logs by action:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('[ActivityLogger] Exception in getActivityLogsByAction:', error)
        return []
    }
}
