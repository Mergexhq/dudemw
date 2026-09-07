import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

/**
 * WhatsApp inbound webhook — Growth Engine Quick Reply routing.
 *
 * Genuine Meta QUICK_REPLY buttons are not links: tapping one sends a message
 * back to the business. This webhook receives those taps and routes the user to
 * the matching Dude Men's Wear storefront destination by sending them the link.
 *
 * Webhook source: Interakt (which hosts the WhatsApp number) — configured in the
 * Interakt dashboard to point at this route. Payload normalization below handles
 * both raw-Meta-shaped and Interakt-forwarded payloads; verified at E2E.
 *
 * ROUTING TABLE — deterministic, single source of truth.
 * Button payload values in the approved template MUST match these keys.
 */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dudemw.com';

const QUICK_REPLY_ROUTES: Record<string, string> = {
  shop_new_arrivals: `${SITE_URL}/products?sort=created_at`, // newest first
  view_catalog: `${SITE_URL}/products`,
};

/** GET — Meta webhook verification handshake. */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  if (!verifyToken) {
    console.error('[WhatsApp Webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    console.log('[WhatsApp Webhook] Verified — returning challenge');
    return new NextResponse(challenge, { status: 200 });
  }

  console.warn('[WhatsApp Webhook] Verification failed');
  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

/** Extract { phone, quickReplyPayload } from raw-Meta or Interakt-forwarded payloads. */
function normalizeInbound(payload: any): { phone: string | null; quickReplyPayload: string | null } {
  // Raw Meta Cloud API shape: entry[].changes[].value.messages[].button.payload
  const metaMsg =
    payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0] ??
    payload?.messages?.[0] ??
    // Interakt forwarded shape (commonly nests under 'data' or 'message')
    payload?.data?.message ??
    payload?.message ??
    null;

  const phone: string | null =
    metaMsg?.from ||
    payload?.data?.from ||
    payload?.from ||
    null;

  // QUICK_REPLY taps arrive as type 'button' with { text, payload };
  // list-reply taps arrive as type 'interactive'. We only need the payload string.
  const quickReplyPayload: string | null =
    metaMsg?.button?.payload ||
    metaMsg?.button?.text ||
    metaMsg?.interactive?.button_reply?.id ||
    metaMsg?.interactive?.list_reply?.id ||
    null;

  return { phone: phone ? String(phone) : null, quickReplyPayload: quickReplyPayload ? String(quickReplyPayload) : null };
}

/** Best-effort link message back to the user. Never throws — routing must not error-loop. */
async function sendStorefrontLink(phone: string, url: string): Promise<void> {
  const apiKey = process.env.INTERAKT_API_KEY;
  if (!apiKey) throw new Error('INTERAKT_API_KEY not set');

  let normalized = String(phone).replace(/\D/g, '');
  if (normalized.length === 12 && normalized.startsWith('91')) normalized = normalized.slice(2);

  const res = await fetch('https://api.interakt.ai/v1/public/message/', {
    method: 'POST',
    headers: { Authorization: `Basic ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      countryCode: '+91',
      phoneNumber: normalized,
      callbackData: 'quick_reply_route',
      type: 'Text',
      data: { message: `Here you go! 👇\n${url}` },
    }),
  });

  if (!res.ok) {
    const bodyText = await res.text().catch(() => '<no body>');
    throw new Error(`Interakt link send failed — ${res.status}: ${bodyText.slice(0, 200)}`);
  }
}

/** POST — inbound button taps. Always 200 to Meta/Interakt; never error-loop. */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const { phone, quickReplyPayload } = normalizeInbound(payload);

    if (!phone || !quickReplyPayload) {
      // Non-button inbound (regular customer chat etc.) — acknowledge, do nothing.
      console.log('[WhatsApp Webhook] Non-routing inbound — ignored');
      return NextResponse.json({ received: true });
    }

    const destination = QUICK_REPLY_ROUTES[quickReplyPayload];
    if (!destination) {
      console.warn(`[WhatsApp Webhook] Unknown quick reply payload "${quickReplyPayload}" — no route`);
      return NextResponse.json({ received: true });
    }

    console.log(`[WhatsApp Webhook] Routing "${quickReplyPayload}" → ${destination}`);
    await sendStorefrontLink(phone, destination);
    return NextResponse.json({ received: true, routed: quickReplyPayload });
  } catch (error: any) {
    // Always acknowledge — Meta retries non-2xx and could loop.
    console.error('[WhatsApp Webhook] Processing error (acknowledged):', error?.message || error);
    return NextResponse.json({ received: true });
  }
}
