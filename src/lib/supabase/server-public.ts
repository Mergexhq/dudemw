import { createClient } from '@supabase/supabase-js'
import { Database } from '../../types/database'

/**
 * Public Supabase client for server-side data fetching without cookies
 * Use this for fetching public data during static generation (build time)
 * DO NOT use for authenticated operations
 */
export function createPublicServerSupabase() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
        }
    )
}
