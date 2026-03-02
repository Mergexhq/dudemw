import prisma from '@/lib/db'

interface RateLimitConfig {
    action: string
    limit: number
    windowMinutes: number
}

/**
 * Check if an action is rate limited for a user
 * Uses admin_activity_logs to count recent actions
 */
export async function checkRateLimit(
    userId: string,
    config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
    try {
        const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000)

        const currentCount = await prisma.admin_activity_logs.count({
            where: {
                admin_user_id: userId,
                action: config.action,
                created_at: { gte: windowStart },
            },
        })

        const remaining = Math.max(0, config.limit - currentCount)

        return {
            allowed: currentCount < config.limit,
            remaining,
        }
    } catch (error) {
        console.error('Rate limit exception:', error)
        return { allowed: true, remaining: 1 }
    }
}
