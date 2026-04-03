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
        // H-5: Fail closed — a DB error should block, not allow, to prevent abuse during outages
        console.error('[RateLimit] DB error — failing closed:', error)
        return { allowed: false, remaining: 0 }
    }
}
