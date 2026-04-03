// ─── Public env (safe to expose to browser) ────────────────────────────────
export const publicEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_WHATSAPP_NUMBER: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '+919876543210',
  NEXT_PUBLIC_SUPPORT_EMAIL: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@dudemw.com',
} as const

// ─── Server-only env (M-1: fail fast on startup if critical vars are missing) ─
function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value || value.trim() === '') {
    throw new Error(
      `[env] Missing required environment variable: "${key}". ` +
      `The application cannot safely start without it.`
    )
  }
  return value.trim()
}

// Only validate in true server contexts (not during `next build` static analysis)
function serverOnlyEnv() {
  // Skip validation during Next.js build phase static analysis
  if (process.env.NEXT_PHASE === 'phase-production-build' && !process.env.RAZORPAY_KEY_SECRET) {
    return {
      RAZORPAY_KEY_SECRET: '',
      RESEND_API_KEY: '',
    }
  }
  return {
    RAZORPAY_KEY_SECRET: requireEnv('RAZORPAY_KEY_SECRET'),
    RESEND_API_KEY: requireEnv('RESEND_API_KEY'),
  }
}

export const serverEnv = serverOnlyEnv()
