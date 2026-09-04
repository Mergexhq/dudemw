# KB — Shipping, Tracking & Delivery (STATIC + semi-static)

> Layer: `01-static` (courier map, lifecycle) + cross-references to dynamic shipping rates in
> `03-db-dynamic/shipping-rules.md`.

---

## KB-SH-001 — Courier tracking URL map

- **category:** Shipping & Tracking
- **intent:** "Where do I track my order?" / "Track my shipment with <courier>"
- **content:**

| Courier | Tracking URL |
|---------|--------------|
| ST Courier | https://stcourier.com/track/shipment |
| DTDC | https://www.dtdc.com/track-your-shipment/ |
| India Post | https://www.indiapost.gov.in/ |
| The Professional Courier | https://www.tpcindia.com/ |

- **source:** Order tracking page `COURIER_URLS` const
- **source_type:** static-code
- **verification_status:** VERIFIED
- **source_location:** `src/app/(store)/track/[orderId]/page.tsx:25–30` (matching logic lines 45–47)
- **refresh_requirement:** Re-extract if the courier list changes (code deploy). Note: the admin
  courier dropdown and this map are kept in sync manually — verify both when adding a courier.

---

## KB-SH-002 — How tracking is delivered to customers

- **category:** Shipping & Tracking
- **intent:** "How will I know when my order is shipped?" / "Where is my tracking link?"
- **content:** Customers receive a tracking link via SMS and email once the order is shipped
  (per CMS FAQ page). Additionally, delivery confirmation is sent to the WhatsApp number given
  in the delivery address (per shipping policy). Admin submits courier + tracking number, which
  triggers the `order_shipped_utility` WhatsApp template with a track-order button.
- **source:** `cms_pages` slug `faq` + `cms_pages` slug `shipping-policy` + Phase 1 automation
  (`order_shipped_utility` template, context doc §7)
- **source_type:** db-static + context-doc
- **verification_status:** VERIFIED
- **source_location:** `cms_pages` (slug='faq', section "Shipping & Delivery"; slug='shipping-policy',
  "Important Information"); `src/lib/services/interakt.ts` sendOrderShipped
- **refresh_requirement:** Re-sync CMS pages on admin edit; template info changes only with code.

---

## KB-SH-003 — Delivery timeline

- **category:** Shipping & Delivery
- **intent:** "How long does delivery take?"
- **content:** **CONFLICTING SOURCES — present the policy value, confirm with client.**
  1. Shipping Policy (cms_pages): "Orders will be delivered within **2–5 days** from the date of
     the order and/or payment... subject to courier company / post office norms."
  2. CMS FAQ page (cms_pages): "Tamil Nadu: **2–4 business days**; Rest of India: **4–7 business
     days**."
  3. FAQ table (faqs): "Orders are delivered within 2–5 days from the date of order and payment,
     subject to courier company norms."

  Sources 1 and 3 agree (2–5 days). Source 2 (the CMS FAQ page) gives region-specific numbers
  that overlap but differ. Both are admin-editable DB content — flag for client to confirm which
  is authoritative (KB-PEND-003). Until resolved, prefer the Shipping Policy wording.
- **source:** `cms_pages` slug `shipping-policy` + `cms_pages` slug `faq` + `faqs` table
- **source_type:** db-static
- **verification_status:** PENDING_CLIENT_CONFIRMATION (two different published timelines)
- **source_location:** `cms_pages` WHERE slug='shipping-policy' ("Delivery Timeline");
  `cms_pages` WHERE slug='faq' ("How long does delivery take?"); `faqs` WHERE title='Shipping'
- **refresh_requirement:** Re-sync on admin edit; re-confirm once client resolves.

---

## KB-SH-004 — Shipping cost structure (DYNAMIC — snapshot only)

- **category:** Shipping & Delivery
- **intent:** "How much does shipping cost?" / "Is shipping free?"
- **content:** ⚠️ **Rates are DB-dynamic — the chatbot must query live shipping rules (or the
  `/api/shipping` endpoint) at answer time. Do NOT answer from this KB file.**

  Snapshot (2026-09-04): flat per-order rates by quantity tier — Tamil Nadu ₹60 (1–3 items) /
  ₹100 (4+ items); all other zones ₹100 (1–3 items) / ₹150 (4+ items). Zones present:
  tamil_nadu, south_india, north_india, east_india, west_india, all_india. Provider "Standard".

  Free-shipping claim: store_settings description says "free shipping on orders above ₹499" and
  the CMS FAQ page says "Free shipping on all orders above ₹499" — but the shipping_rules table
  has **no free-shipping threshold logic** (only per-tier flat rates). Whether free shipping
  above ₹499 is actually applied at checkout must be confirmed (KB-PEND-004).
- **source:** `shipping_rules` + `shipping_zones` (Neon DB) + `store_settings.description` +
  `cms_pages` slug `faq`
- **source_type:** db-dynamic (rates) + db-static (free-shipping claim)
- **verification_status:** PENDING_CLIENT_CONFIRMATION (free-shipping threshold vs rules table)
- **source_location:** `shipping_rules` (12 active rows); full snapshot in
  `03-db-dynamic/shipping-rules.md`; `store_settings` row 1
- **refresh_requirement:** LIVE — query `shipping_rules` at answer time. Snapshot re-synced only
  for audit purposes.

---

## KB-SH-005 — Order lifecycle (shipping-relevant facts)

- **category:** Orders & Lifecycle
- **intent:** "What happens after I order?" / "When will my order ship?"
- **content:**
  - Order placed → status `pending`; Razorpay orders also get a Razorpay order ID for payment.
  - Payment verified (client callback → webhook → reconciliation cron, 3-layer safety net) →
    order becomes `processing` / `paid`.
  - Admin packs (→ `packed`) and ships with a courier + tracking number (→ `shipped`,
    `shipped_at` recorded, WhatsApp `order_shipped_utility` sent).
  - Admin marks delivered (→ `delivered`, `delivered_at` recorded).
  - Unpaid Razorpay orders auto-expire after 24h (`cancelled` / `expired`).
  - COD orders stay `payment_status=pending` through fulfilment.
- **source:** MERGEX_DUDEMW_CONTEXT.md §9 (order lifecycle, confirmed from code)
- **source_type:** context-doc
- **verification_status:** VERIFIED
- **source_location:** `MERGEX_DUDEMW_CONTEXT.md` §9; `src/lib/services/order-status.ts`
- **refresh_requirement:** Update only if the order lifecycle changes (code deploy).

---

## KB-SH-006 — Address change after ordering

- **category:** Shipping & Delivery
- **intent:** "Can I change my shipping address after placing an order?"
- **content:** "Please contact us immediately at 9488924935 via WhatsApp if you need to change
  your shipping address. We'll do our best to accommodate if the order hasn't been shipped yet."
- **source:** `faqs` table — "Shipping" category
- **source_type:** db-static
- **verification_status:** VERIFIED (phone matches canonical WhatsApp number)
- **source_location:** `faqs` WHERE title='Shipping' AND question LIKE 'Can I change my shipping address%'
- **refresh_requirement:** Re-sync when admin edits FAQs.
