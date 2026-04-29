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
