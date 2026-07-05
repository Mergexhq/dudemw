import { prisma } from '@/lib/db'

const CONFIG_KEY = 'instagram_access_token'

/**
 * Read the active Instagram access token from the DB.
 * Falls back to the env var so the app keeps working if the DB row is missing.
 */
export async function getInstagramToken(): Promise<string> {
    const row = await prisma.app_config.findUnique({ where: { key: CONFIG_KEY } })
    if (row?.value) return row.value

    // Fallback: env var (used during initial migration window)
    const envToken = process.env.NEXT_PUBLIC_INSTAGRAM_ACCESS_TOKEN
    if (envToken) return envToken

    throw new Error('[Instagram] Access token not found in DB or environment')
}

/**
 * Persist a refreshed token (and reset the updated_at timestamp).
 * Called by the /api/cron/refresh-instagram-token endpoint after a successful Meta refresh.
 */
export async function saveInstagramToken(newToken: string): Promise<void> {
    await prisma.app_config.upsert({
        where: { key: CONFIG_KEY },
        create: { key: CONFIG_KEY, value: newToken },
        update: { value: newToken, updated_at: new Date() },
    })
}
