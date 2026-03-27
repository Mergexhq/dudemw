'use server'

import { SettingsService } from '@/lib/services/settings'
import { PaymentSettings } from '@/lib/types/settings'
import { getCached, CacheTTL } from '@/lib/cache/server-cache'
import { serializePrisma } from '@/lib/utils/prisma-utils'

/**
 * Pre-fetch checkout data server-side to eliminate client-side waterfalls.
 * Payment settings are slow-changing — cached for 60 seconds.
 */
export async function getCheckoutData(): Promise<{
  paymentSettings: PaymentSettings | null
}> {
  try {
    const paymentSettings = await getCached(
      'checkout:payment-settings',
      async () => {
        const result = await SettingsService.getPaymentSettings()
        return result.success ? result.data ?? null : null
      },
      60 // 60 seconds — admins rarely change payment settings mid-session
    )

    return { paymentSettings: serializePrisma(paymentSettings ?? null) }
  } catch (error) {
    console.error('[getCheckoutData] Failed to fetch checkout data:', error)
    // Safe fallback: enable Razorpay so checkout is never completely blocked
    return {
      paymentSettings: serializePrisma({
        id: 'fallback',
        razorpay_enabled: true,
        razorpay_key_id: null,
        razorpay_key_secret: null,
        razorpay_test_mode: false,
        cod_enabled: false,
        cod_max_amount: null,
        payment_methods: ['razorpay'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }
}
