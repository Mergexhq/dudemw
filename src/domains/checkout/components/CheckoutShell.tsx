'use client'

import { PaymentSettings } from '@/lib/types/settings'
import CheckoutPage from './CheckoutPage'

interface CheckoutShellProps {
  paymentSettings: PaymentSettings | null
}

/**
 * Thin client wrapper that passes server-fetched payment settings
 * down to CheckoutPage, eliminating the client-side payment settings fetch.
 */
export default function CheckoutShell({ paymentSettings }: CheckoutShellProps) {
  return <CheckoutPage preloadedPaymentSettings={paymentSettings} />
}
