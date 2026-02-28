import { prisma } from '@/lib/db'

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

/** Log an admin activity */
export async function logActivity(data: ActivityLogData): Promise<void> {
    try {
        await prisma.admin_activity_logs.create({
            data: {
                admin_user_id: data.adminUserId,
                action: data.action,
                entity_type: data.entityType,
                entity_id: data.entityId,
                metadata: data.metadata as any,
                ip_address: data.ipAddress,
                user_agent: data.userAgent,
            },
        })
    } catch (error) {
        console.error('[ActivityLogger] Exception in logActivity:', error)
    }
}

/** Get activity logs for a specific admin user */
export async function getUserActivityLogs(userId: string, limit: number = 50): Promise<any[]> {
    try {
        return await prisma.admin_activity_logs.findMany({
            where: { admin_user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit,
        })
    } catch (error) {
        console.error('[ActivityLogger] Exception in getUserActivityLogs:', error)
        return []
    }
}

/** Get recent activity logs (all users) */
export async function getRecentActivityLogs(limit: number = 100): Promise<any[]> {
    try {
        return await prisma.admin_activity_logs.findMany({
            orderBy: { created_at: 'desc' },
            take: limit,
        })
    } catch (error) {
        console.error('[ActivityLogger] Exception in getRecentActivityLogs:', error)
        return []
    }
}

/** Get activity logs by action */
export async function getActivityLogsByAction(action: string, limit: number = 50): Promise<any[]> {
    try {
        return await prisma.admin_activity_logs.findMany({
            where: { action },
            orderBy: { created_at: 'desc' },
            take: limit,
        })
    } catch (error) {
        console.error('[ActivityLogger] Exception in getActivityLogsByAction:', error)
        return []
    }
}
