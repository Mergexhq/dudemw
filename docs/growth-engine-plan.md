# Growth Engine — Interactive Broadcast Architecture (Implementation Plan)

> Stage 1 deliverable. Read-only inspection of the existing repo/Interakt integration;
> no code written yet. Proportional to the signed SOW: "Architecture supporting rich-media
> WhatsApp broadcasts (high-resolution apparel images/videos). Implementation of Meta's
> interactive Quick Reply routing (e.g. 'Shop New Arrivals') directing users straight to
> the storefront."

## What already exists (and gets reused)

| Asset | Location | Reuse |
|-------|----------|-------|
| Interakt service | `src/lib/services/interakt.ts` | Same fetch/Basic-auth client; add broadcast send fn |
| Admin API secret pattern | `src/app/api/admin/payments/recover-pending/route.ts` (`x-admin-secret` vs `ADMIN_API_SECRET`) | Broadcast trigger auth |
| Clerk admin pattern | `auth()` + `admin_profiles` (`isActiveAdmin`) | Admin UI trigger auth |
| Customers | `customers` (phone, status, customer_type, last_order_at) | Recipient targeting |
| Orders | `orders` (purchase history joins) | Segmentation filters |
| Campaigns | `campaigns` + `campaign_actions` | (Future) link broadcast to a discount campaign |
| Product media | `products` + `product_images` (Cloudinary) | Media source for headers |
| Audit log | `audit_logs` model | Broadcast send log (idempotency + trace) |
| Storefront targets | `/products` (supports `sort`, `category`, `q`), `/products/[slug]`, `/categories/[slug]` | Quick Reply destinations |
| Env conventions | `INTERAKT_RECOVERY_TEMPLATE` pattern | `INTERAKT_BROADCAST_TEMPLATE` env var |

## Architecture

### 1. Rich-media broadcast send — `src/lib/services/interakt.ts` (additive)

New exported function `sendBroadcastTemplate(payload)`:

- Template name from `process.env.INTERAKT_BROADCAST_TEMPLATE` (no default — same
  fail-closed convention as the recovery template; not configured = function throws).
- Media header: Interakt's template API for media-header templates uses an `imageUrl`
  (or `videoUrl`) field alongside `templateData` — the function accepts `headerMediaUrl`
  in the payload and includes it only when provided. Exact field placement will follow the
  approved template's structure (confirmed during E2E, same as we did for `_2x`).
- Body variables: `bodyValues: string[]` — caller supplies (no fixed contract; broadcast
  body copy varies per campaign).
- Quick Reply buttons: `buttonValues: { [index]: string[] }` — same proven pattern as the
  recovery/shipped URL buttons, but for QUICK_REPLY-type buttons the values are the button
  payloads Interakt echoes back on click.
- No campaign/product hardcoding — caller passes everything.

### 2. Quick Reply routing — `src/app/api/webhooks/whatsapp/route.ts` (new)

Genuine Meta Quick Replies are **not links** — tapping one sends a message back to the
business. That requires an inbound webhook. Minimum production-safe implementation:

- `GET` — Meta webhook verification handshake (`hub.mode/hub.challenge/hub.verify_token`,
  token from `WHATSAPP_WEBHOOK_VERIFY_TOKEN` env). Note: when Interakt hosts the WhatsApp
  number, Meta webhooks are typically configured **inside Interakt's dashboard** (Interakt
  → Settings → Webhooks), pointing at our route. If Interakt's webhook payload shape differs
  from raw Meta, the route normalizes it — verified at E2E with a test reply.
- `POST` — signature check where available, then payload normalization:
  extract `from` (phone) + `button.text` / `button.payload` (the Quick Reply tap).
- **Deterministic routing table** — plain object, no DB:
  ```ts
  const QUICK_REPLY_ROUTES = {
    'shop_new_arrivals': `${SITE_URL}/products?sort=created_at`,   // newest first
    'view_catalog':      `${SITE_URL}/products`,
  } as const;
  ```
  Quick Reply buttons are defined with `payload` values matching these keys (set when the
  template is created in Interakt). On tap → respond by sending that user the matching
  storefront **link message** (via Interakt's template/text API).
- Unknown/unsupported payloads: log + no-op (never error-loop with Meta).
- This route does not touch Phase 1 flows; it only handles inbound button taps.

  **Alternative (already rejected per instructions):** URL-button-only "routing" — works
  without a webhook but is not Meta Quick Reply, and the SOW names Quick Reply explicitly.

### 3. Recipient targeting — `src/lib/services/broadcast.ts` (new, ~150 lines)

Pure Prisma queries against existing tables; no new segmentation tables:

- `getBroadcastAudience(filter)` with a deliberately small filter set:
  - `all` — active customers (`customers.status='active'`, valid phone)
  - `with_orders` — ≥1 order
  - `recent` — ordered since N days (uses `orders.created_at`)
  - (optional later: wishlist-based — `wishlists` exists if ever needed)
- Phone normalization identical to existing senders (strip non-digits, 91-prefix).
- **Idempotency:** before any send, insert an `audit_logs` row
  (`action='whatsapp_broadcast'`, `entity_id=<broadcastId>`, `details={template, filter,
  recipientCount, recipientIds}`); the trigger refuses to run if an audit row with the same
  client-supplied `broadcastId` already exists → accidental double-click/double-cron cannot
  double-send. Per-recipient send results appended to the same audit row's `details`.
- **Test mode (hard safety):** if `process.env.BROADCAST_TEST_PHONE` is set, ALL sends go
  to that single number regardless of audience — used for E2E before go-live. If unset and
  the request does not explicitly pass `confirm: true`, the endpoint refuses to send.

### 4. Admin trigger — `src/app/api/admin/broadcasts/send/route.ts` (new)

- `POST` — auth: `x-admin-secret === ADMIN_API_SECRET` (exact pattern of the existing
  `recover-pending` route; documented as the internal/Mergex mechanism).
- Body: `{ broadcastId, template?, headerMediaUrl?, bodyValues?, quickReplyPayloadKeys?,
  filter: { type: 'all'|'with_orders'|'recent', days? }, testPhone? }`.
- Auth alternative for an admin UI button later: Clerk `auth()` + `isActiveAdmin` —
  not built now (no UI in scope; endpoint is the contracted minimum).
- Returns per-recipient status summary; failures logged, never thrown mid-batch.

## Files

| File | Change |
|------|--------|
| `src/lib/services/interakt.ts` | + `sendBroadcastTemplate()` (additive only) |
| `src/lib/services/broadcast.ts` | new — audience query + idempotency + test-mode |
| `src/app/api/admin/broadcasts/send/route.ts` | new — authorized trigger |
| `src/app/api/webhooks/whatsapp/route.ts` | new — inbound Quick Reply routing |
| `prisma/schema.prisma` | **no changes required** (audit_logs reused for idempotency) |
| Phase 1 / recovery files | **untouched** |

## Env vars (new)

- `INTERAKT_BROADCAST_TEMPLATE` — approved media+quick-reply template name (fail-closed).
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` — Meta/Interakt webhook handshake.
- `BROADCAST_TEST_PHONE` — E2E test sink (dev/test only).

## Interakt/Meta dashboard (client action, blocked until code is in)

1. Create template: IMAGE or VIDEO header (hi-res apparel media), body with variables,
   two QUICK_REPLY buttons — "Shop New Arrivals" (payload `shop_new_arrivals`) and
   "View Catalog" (payload `view_catalog`). Submit for Meta approval.
2. Configure the webhook (Interakt → webhooks) pointing at
   `https://dudemw.com/api/webhooks/whatsapp` for inbound button replies.

## Open decisions (client)

1. Media type for template v1: image (simplest, recommended) or video?
2. Exact Quick Reply set + payloads (default: Shop New Arrivals / View Catalog).
3. Final body copy + variables for the first broadcast.

## Validation plan (Stage 3)

`tsc --noEmit` → `npm run build` → grep-verify recovery/Phase 1 files untouched →
verify endpoint refuses to send without secret/confirm/test-phone → idempotency check
(same `broadcastId` twice = second call refused) → then STOP (no template creation,
no Meta submission, no real sends, no commit/push/deploy).
