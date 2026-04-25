/**
 * /track/[orderId] — Courier Tracking Redirect Proxy
 *
 * This page is the target of the WhatsApp "Track Order" button.
 * Interakt sends a static base URL (https://dudemw.com/track/) with the
 * orderId appended as a dynamic variable.
 *
 * Flow:
 *  1. Customer clicks WhatsApp button → lands here
 *  2. We look up shipping_provider in the DB for this orderId
 *  3. switch() → redirect() to the correct courier tracking website
 *
 * Meta's domain policy only allows our own domain in approved templates,
 * so this proxy pattern is the correct approach.
 */

import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/db'

interface TrackPageProps {
  params: Promise<{ orderId: string }>
}

// Courier tracking base URLs
const COURIER_URLS = {
  'ST Courier':             'https://stcourier.com/track/shipment',
  'DTDC':                   'https://www.dtdc.com/track-your-shipment/',
  'India Post':             'https://www.indiapost.gov.in/',
  'The Professional Courier': 'https://www.tpcindia.com/',
} as const

type SupportedCarrier = keyof typeof COURIER_URLS

function getTrackingUrl(carrier: string | null | undefined): string {
  if (!carrier) return 'https://dudemw.com'

  // Exact match first
  if (carrier in COURIER_URLS) {
    return COURIER_URLS[carrier as SupportedCarrier]
  }

  // Fuzzy fallback for legacy data (e.g. old "Professional" value)
  const lower = carrier.toLowerCase()
  if (lower.includes('st courier'))              return COURIER_URLS['ST Courier']
  if (lower.includes('dtdc'))                    return COURIER_URLS['DTDC']
  if (lower.includes('india post'))              return COURIER_URLS['India Post']
  if (lower.includes('professional'))            return COURIER_URLS['The Professional Courier']

  // Unknown carrier → fall back to homepage
  return 'https://dudemw.com'
}

export default async function TrackOrderPage({ params }: TrackPageProps) {
  const { orderId } = await params

  if (!orderId) notFound()

  // Look up only the fields we need — keeps the query fast
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      shipping_provider: true,
      shipping_tracking_number: true,
      order_status: true,
    },
  }).catch(() => null)

  if (!order) notFound()

  const targetUrl = getTrackingUrl(order.shipping_provider)

  // Server-side redirect — customer never sees this page
  redirect(targetUrl)
}
