import { createClient } from '@/lib/supabase/client'

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
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, serviceRoleKey)

        // Calculate window start time
        const windowStart = new Date(Date.now() - config.windowMinutes * 60 * 1000).toISOString()

        // Count actions in the window
        const { count, error } = await supabase
            .from('admin_activity_logs')
            .select('*', { count: 'exact', head: true })
            .eq('admin_user_id', userId)
            .eq('action', config.action)
            .gte('created_at', windowStart)

        if (error) {
            console.error('Rate limit check error:', error)
            // Fail open if internal error, but log it
            return { allowed: true, remaining: 1 }
        }

        const currentCount = count || 0
        const remaining = Math.max(0, config.limit - currentCount)

        return {
            allowed: currentCount < config.limit,
            remaining
        }
    } catch (error) {
        console.error('Rate limit exception:', error)
        return { allowed: true, remaining: 1 }
    }
}
