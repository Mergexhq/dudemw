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
 * Interakt API keys are already Base64-encoded tokens — pass them directly.
 * Header format: Authorization: Basic <api_key>
 */
function getAuthHeader(): string {
  const apiKey = process.env.INTERAKT_API_KEY
  if (!apiKey) {
    throw new Error('INTERAKT_API_KEY is not set in environment variables')
  }
  return `Basic ${apiKey}`
}

// ---------------------------------------------------------------------------
// Task 3 — Abandoned Cart / Payment Failure Recovery
// Template name comes from INTERAKT_RECOVERY_TEMPLATE (env) — no default is
// hardcoded because the template must exist and be Meta-approved first.
// Approved template contract (Meta-approved):
//   Body: {{1}} Customer Name | {{2}} Order ID (last 8) | {{3}} Total Amount
//   Button [0]: URL  dudemw.com/checkout?resume={{1}}  — button var = order UUID
// (resumeUrl in the payload is no longer a body variable — the button builds
//  the URL from the template prefix + order id. Kept in the payload so callers
//  don't change; used only for logging.)
// ---------------------------------------------------------------------------

export interface CheckoutRecoveryPayload {
  customerPhone: string // 10-digit national number, e.g. "9876543210"
  customerName: string  // {{1}}
  orderId: string       // {{2}} — last 8 chars for display; full UUID for button URL
  totalAmount: number   // {{3}} — formatted as "₹X,XXX" before sending
  resumeUrl: string     // informational — the button URL is built by the template itself
}

export function isRecoveryTemplateConfigured(): boolean {
  return Boolean(process.env.INTERAKT_RECOVERY_TEMPLATE?.trim())
}

export async function sendCheckoutRecovery(
  payload: CheckoutRecoveryPayload
): Promise<void> {
  const templateName = process.env.INTERAKT_RECOVERY_TEMPLATE?.trim()
  if (!templateName) {
    throw new Error(
      'INTERAKT_RECOVERY_TEMPLATE is not set — WhatsApp recovery template has not been configured. ' +
      'Set it to the exact approved Interakt template name before enabling recovery messages.'
    )
  }

  let { customerPhone } = payload
  const { customerName, orderId, totalAmount, resumeUrl } = payload

  // Same phone sanitization convention as sendOrderShipped
  customerPhone = String(customerPhone).replace(/\D/g, '')
  if (customerPhone.length === 12 && customerPhone.startsWith('91')) {
    customerPhone = customerPhone.slice(2)
  }

  const displayOrderId = String(orderId).slice(-8).toUpperCase()
  const formattedAmount = `₹${Number(totalAmount).toLocaleString('en-IN')}`

  const body = {
    countryCode: '+91',
    phoneNumber: customerPhone,
    callbackData: `checkout_recovery_${orderId}`,
    type: 'Template',
    template: {
      name: templateName,
      languageCode: 'en',
      bodyValues: [
        String(customerName || 'Customer'), // {{1}}
        displayOrderId,                     // {{2}}
        formattedAmount,                    // {{3}}
      ],
      // Interakt requires buttonValues to map the button index to an ARRAY of strings.
      // Button [0] URL is dudemw.com/checkout?resume={{1}} — we supply the order UUID
      // so the final URL becomes /checkout?resume=<order id>.
      buttonValues: {
        '0': [String(orderId)],
      },
    },
  }

  const response = await fetch(INTERAKT_API_URL, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  let responseData;
  try {
    responseData = await response.json();
  } catch (e) {
    responseData = await response.text().catch(() => '<no body>');
  }

  if (!response.ok || responseData?.result === false) {
    throw new Error(
      `Interakt recovery template "${templateName}" failed — ${response.status}: ${JSON.stringify(responseData)}`
    )
  }

  console.log(`[Interakt] Successfully sent recovery template "${templateName}" to +91${customerPhone}. Response:`, JSON.stringify(responseData))
}

// ---------------------------------------------------------------------------
// Task 4 — Growth Engine: Rich-Media Broadcast (Media Header + Quick Replies)
// Template name comes from INTERAKT_BROADCAST_TEMPLATE (env) — no default;
// the template must exist and be Meta-approved first (fail-closed, same
// convention as the recovery template).
// Payload contract:
//   headerMediaUrl  — public https URL of the image/video shown in the header
//   bodyValues      — ordered body variables per the approved template
//   buttonValues    — { '<buttonIndex>': [payloadValue] } for QUICK_REPLY buttons;
//                     the payload keys are matched by the inbound webhook router
//                     (src/app/api/webhooks/whatsapp/route.ts) to storefront URLs.
// Interakt's media-template API placement of the header URL is verified during
// E2E against the approved template (same process as checkout_recovery_dudemw_2x).
// ---------------------------------------------------------------------------

export interface BroadcastPayload {
  customerPhone: string       // 10-digit national number
  headerMediaUrl: string      // public media URL for the template header
  mediaType?: 'image' | 'video' // default 'image' — must match the approved template's header type
  bodyValues: string[]        // ordered body variables
  buttonValues?: Record<string, string[]> // quick-reply button payloads by index
}

export async function sendBroadcastTemplate(
  payload: BroadcastPayload
): Promise<void> {
  const templateName = process.env.INTERAKT_BROADCAST_TEMPLATE?.trim()
  if (!templateName) {
    throw new Error(
      'INTERAKT_BROADCAST_TEMPLATE is not set — the rich-media broadcast template has not ' +
      'been configured. Set it to the exact approved Interakt template name before sending broadcasts.'
    )
  }

  let { customerPhone, headerMediaUrl, mediaType, bodyValues, buttonValues } = payload

  // Same phone sanitization convention as the other senders
  customerPhone = String(customerPhone).replace(/\D/g, '')
  if (customerPhone.length === 12 && customerPhone.startsWith('91')) {
    customerPhone = customerPhone.slice(2)
  }

  // Media header field: image and video templates use different keys.
  // Exact placement verified during E2E against the approved template.
  const headerField = mediaType === 'video' ? 'videoUrl' : 'imageUrl'

  const body: Record<string, unknown> = {
    countryCode: '+91',
    phoneNumber: customerPhone,
    callbackData: `broadcast_${templateName}`,
    type: 'Template',
    template: {
      name: templateName,
      languageCode: 'en',
      // Omit bodyValues entirely for zero-variable (static copy) templates —
      // sending an empty array can be rejected by the API.
      ...(bodyValues.length > 0 ? { bodyValues: bodyValues.map(String) } : {}),
      ...(buttonValues && Object.keys(buttonValues).length > 0 ? { buttonValues } : {}),
      [headerField]: headerMediaUrl,
    },
  }

  const response = await fetch(INTERAKT_API_URL, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  let responseData;
  try {
    responseData = await response.json();
  } catch (e) {
    responseData = await response.text().catch(() => '<no body>');
  }

  if (!response.ok || responseData?.result === false) {
    throw new Error(
      `Interakt broadcast template "${templateName}" failed — ${response.status}: ${JSON.stringify(responseData)}`
    )
  }

  console.log(`[Interakt] Successfully sent broadcast template "${templateName}" to +91${customerPhone}. Response:`, JSON.stringify(responseData))
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
  const displayOrderId = orderId.slice(-8).toUpperCase()

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
        displayOrderId, // {{2}}
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

  let responseData;
  try {
    responseData = await response.json();
  } catch (e) {
    responseData = await response.text().catch(() => '<no body>');
  }

  if (!response.ok || responseData?.result === false) {
    throw new Error(
      `Interakt order_confirmation_dudemw failed — ${response.status}: ${JSON.stringify(responseData)}`
    )
  }

  console.log(`[Interakt] Successfully triggered message. Response:`, JSON.stringify(responseData));
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
  try {
    let { customerPhone, customerName, orderId, shippingCarrier, trackingNumber } = payload

    // 1. Robust Phone Sanitization
    // Strip all non-numeric characters
    customerPhone = String(customerPhone).replace(/\D/g, '')
    // Prevent +9191 duplication if the number is exactly 12 digits and starts with 91
    if (customerPhone.length === 12 && customerPhone.startsWith('91')) {
      customerPhone = customerPhone.slice(2)
    }

    const displayOrderId = String(orderId).slice(-8).toUpperCase()

    // 2. Payload Verification & String Casting
    const safeCustomerName = String(customerName || 'Customer')
    const safeCarrier = String(shippingCarrier || 'Courier')
    const safeTracking = String(trackingNumber || 'N/A')
    const safeOrderId = String(orderId)

    const body = {
      countryCode: '+91',
      phoneNumber: customerPhone,
      callbackData: `order_shipped_${safeOrderId}`,
      type: 'Template',
      template: {
        name: "order_shipped_utility",
        languageCode: 'en',
        bodyValues: [
          safeCustomerName, // {{1}}
          displayOrderId,   // {{2}}
          safeCarrier,      // {{3}}
          safeTracking,     // {{4}}
        ],
        // Interakt requires buttonValues to map the button index to an ARRAY of strings
        buttonValues: {
          '0': [safeOrderId]
        }
      }
    }

    // 3. Production Logging
    console.log(`[Interakt] Attempting to send order_shipped_dudemw to +91${customerPhone}. Payload:`, JSON.stringify(body))

    const response = await fetch(INTERAKT_API_URL, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    let responseData;
    try {
      responseData = await response.json();
    } catch (e) {
      responseData = await response.text();
    }

    if (!response.ok || responseData?.result === false) {
      console.error(`[Interakt] order_shipped_dudemw failed with status ${response.status}. Rejection Reason:`, JSON.stringify(responseData))
      throw new Error(`Interakt API Error: ${response.status} - ${JSON.stringify(responseData)}`)
    }

    console.log(`[Interakt] Successfully triggered order_shipped_dudemw. Response:`, JSON.stringify(responseData))

  } catch (error) {
    console.error(`[Interakt] Fatal error in sendOrderShipped:`, error)
    throw error
  }
}
