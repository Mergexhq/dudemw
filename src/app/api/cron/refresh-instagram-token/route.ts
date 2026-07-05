import { NextResponse } from 'next/server'
import { getInstagramToken, saveInstagramToken } from '@/lib/instagram-token'

/**
 * GET /api/cron/refresh-instagram-token
 *
 * Automatically extends the Instagram long-lived access token for another 60 days.
 * Must be called at least once every 60 days — Hostinger cron is set to run on the
 * 1st of every month (cron: 0 0 1 * *), which is well within the safe window.
 *
 * Meta requirement: the token must be at least 24 hours old before it can be refreshed.
 *
 * Security: requires Bearer {CRON_SECRET} in the Authorization header (same pattern as other cron routes).
 */
export async function GET(request: Request) {
    try {
        // ── Auth ──────────────────────────────────────────────────────────────
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            console.error('[Cron] Unauthorized access attempt to refresh-instagram-token')
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
        }

        console.log('[Cron] Starting Instagram token refresh...')

        // ── Fetch current token from DB ───────────────────────────────────────
        let currentToken: string
        try {
            currentToken = await getInstagramToken()
        } catch (err: any) {
            console.error('[Cron] Failed to read current Instagram token:', err.message)
            return NextResponse.json({ success: false, error: 'Could not read current token from DB' }, { status: 500 })
        }

        // ── Call Meta refresh endpoint ─────────────────────────────────────────
        const refreshUrl =
            `https://graph.instagram.com/refresh_access_token` +
            `?grant_type=ig_refresh_token` +
            `&access_token=${encodeURIComponent(currentToken)}`

        const metaResponse = await fetch(refreshUrl, { method: 'GET' })
        const metaData = await metaResponse.json()

        if (!metaResponse.ok || !metaData.access_token) {
            console.error('[Cron] Meta token refresh failed:', {
                status: metaResponse.status,
                error: metaData?.error,
            })
            return NextResponse.json(
                {
                    success: false,
                    error: 'Meta token refresh failed',
                    details: metaData?.error ?? metaData,
                },
                { status: 502 }
            )
        }

        const newToken: string = metaData.access_token
        const expiresIn: number = metaData.expires_in ?? 5184000 // ~60 days

        // ── Persist the refreshed token ───────────────────────────────────────
        await saveInstagramToken(newToken)

        const expiresInDays = Math.floor(expiresIn / 86400)
        console.log(`[Cron] Instagram token refreshed successfully. Expires in ${expiresInDays} days.`)

        return NextResponse.json({
            success: true,
            expiresIn,
            expiresInDays,
            refreshedAt: new Date().toISOString(),
        })
    } catch (error: any) {
        console.error('[Cron] Unexpected error in refresh-instagram-token:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
}
