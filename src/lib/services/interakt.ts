/**
 * Interakt WhatsApp Notification Service
 *
 * Fires template-based WhatsApp messages via the Interakt API.
 * All calls are intended to be non-blocking (fire-and-forget).
 *
 * Docs: https://docs.interakt.ai/reference/send-message
 */

const INTERAKT_API_URL = 'https://api.interakt.ai/v1/public/message/'

/**
 * Build Basic-Auth header from the Interakt API key stored in env.
 * Interakt expects:  Authorization: Basic <base64(apiKey:)>
 */
function getAuthHeader(): string {
  const apiKey = process.env.INTERAKT_API_KEY
  if (!apiKey) {
    throw new Error('INTERAKT_API_KEY is not set in environment variables')
  }
  // The Interakt Basic-Auth scheme uses the key as the "username" with an empty password
  const encoded = Buffer.from(`${apiKey}:`).toString('base64')
  return `Basic ${encoded}`
}

// ---------------------------------------------------------------------------
// Task 1 — Order Confirmation
// Template: order_confirmation_dudemw
// {{1}} Customer Name | {{2}} Order ID | {{3}} Order Date | {{4}} Total Amount
// ---------------------------------------------------------------------------

export interface OrderConfirmationPayload {
  customerPhone: string // E.164 format, e.g. "919876543210"
  customerName: string  // {{1}}
  orderId: string       // {{2}}
  orderDate: Date       // {{3}} — formatted as YYYY-MM-DD before sending
  totalAmount: number   // {{4}} — formatted as "₹X,XXX" before sending
}

export async function sendOrderConfirmation(
  payload: OrderConfirmationPayload
): Promise<void> {
  const { customerPhone, customerName, orderId, orderDate, totalAmount } = payload

  const formattedDate = orderDate.toISOString().split('T')[0] // YYYY-MM-DD
  const formattedAmount = `₹${totalAmount.toLocaleString('en-IN')}`

  const body = {
    countryCode: '+91',
    phoneNumber: customerPhone,
    callbackData: `order_confirmation_${orderId}`,
    type: 'Template',
    template: {
      name: 'order_confirmation_dudemw',
      languageCode: 'en',
      bodyValues: [
        customerName,   // {{1}}
        orderId,        // {{2}}
        formattedDate,  // {{3}}
        formattedAmount // {{4}}
      ]
    }
  }

  const response = await fetch(INTERAKT_API_URL, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '<no body>')
    throw new Error(
      `Interakt order_confirmation_dudemw failed — ${response.status}: ${errorText}`
    )
  }
}

// ---------------------------------------------------------------------------
// Task 2 — Order Shipped
// Template: order_shipped_dudemw
// {{1}} Customer Name | {{2}} Order ID | {{3}} Carrier | {{4}} Tracking No | {{5}} Order ID (button URL)
// ---------------------------------------------------------------------------

export interface OrderShippedPayload {
  customerPhone: string  // E.164 format
  customerName: string   // {{1}}
  orderId: string        // {{2}} and {{5}}
  shippingCarrier: string // {{3}}
  trackingNumber: string  // {{4}}
}

export async function sendOrderShipped(
  payload: OrderShippedPayload
): Promise<void> {
  const { customerPhone, customerName, orderId, shippingCarrier, trackingNumber } = payload

  const body = {
    countryCode: '+91',
    phoneNumber: customerPhone,
    callbackData: `order_shipped_${orderId}`,
    type: 'Template',
    template: {
      name: 'order_shipped_dudemw',
      languageCode: 'en',
      bodyValues: [
        customerName,    // {{1}}
        orderId,         // {{2}}
        shippingCarrier, // {{3}}
        trackingNumber,  // {{4}}
      ],
      // {{5}} is used in the dynamic button URL: https://dudemw.com/track/[orderId]
      // Interakt injects the button URL value separately via the `buttonValues` field
      buttonValues: {
        '0': orderId    // {{5}} — appended to the button base URL
      }
    }
  }

  const response = await fetch(INTERAKT_API_URL, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '<no body>')
    throw new Error(
      `Interakt order_shipped_dudemw failed — ${response.status}: ${errorText}`
    )
  }
}
