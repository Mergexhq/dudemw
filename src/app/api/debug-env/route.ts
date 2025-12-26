import { NextResponse } from 'next/server'

/**
 * Debug endpoint to check environment variables
 * IMPORTANT: Remove this after debugging!
 */
export async function GET() {
    // Check if admin subdomain (only allow debugging from admin)
    const envCheck = {
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,

        // Supabase URL
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseUrlValue: process.env.NEXT_PUBLIC_SUPABASE_URL
            ? process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 40) + '...'
            : 'NOT SET',

        // Anon Key
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
        anonKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30) + '...'
            : 'NOT SET',

        // Service Role Key (the critical one!)
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length || 0,
        serviceRoleKeyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY
            ? process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 30) + '...'
            : 'NOT SET',
        serviceRoleKeyLooksValid: process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ') || false,

        // Admin Setup Key
        hasAdminSetupKey: !!process.env.ADMIN_SETUP_KEY,

        // Check if keys are different (they should be!)
        keysAreDifferent: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== process.env.SUPABASE_SERVICE_ROLE_KEY,

        // Other env vars
        hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
        hasAdminUrl: !!process.env.NEXT_PUBLIC_ADMIN_URL,
        adminUrl: process.env.NEXT_PUBLIC_ADMIN_URL || 'NOT SET',
    }

    return NextResponse.json(envCheck)
}
