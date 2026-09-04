'use client'

import { PaymentSettings } from '@/lib/types/settings'
import CheckoutPage from './CheckoutPage'

type ResumeOrder = React.ComponentProps<typeof CheckoutPage>['resumeOrder']

interface CheckoutShellProps {
  paymentSettings: PaymentSettings | null
  resumeOrder?: ResumeOrder
}

/**
 * Thin client wrapper that passes server-fetched payment settings
 * and optional resume order data down to CheckoutPage, eliminating
 * the client-side payment settings fetch.
 */
export default function CheckoutShell({ paymentSettings, resumeOrder }: CheckoutShellProps) {
  return <CheckoutPage preloadedPaymentSettings={paymentSettings} resumeOrder={resumeOrder ?? null} />
}
