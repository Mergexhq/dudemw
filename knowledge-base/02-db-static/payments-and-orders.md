# KB — Payments & Orders (semi-static)

> Payment-method availability is DB-driven (`payment_settings`); policy text is DB-static.
> Per-customer order data is **never** general chatbot knowledge.

---

## KB-PA-001 — Accepted payment methods

- **category:** Payments & Checkout
- **intent:** "What payment methods do you accept?"
- **content:** Per the CMS FAQ page: UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, Net
  Banking, and Cash on Delivery (COD). The actual live enablement of Razorpay vs COD is governed
  by the `payment_settings` table (razorpay_enabled, cod_enabled, cod_max_amount) — the chatbot
  should ultimately verify against live settings rather than the static list.
- **source:** `cms_pages` slug `faq` (section "Ordering & Payment") + `payment_settings` model
- **source_type:** db-static (list) + db-dynamic (enablement flags)
- **verification_status:** VERIFIED (list); enablement flags to be checked live at answer time
- **source_location:** `cms_pages` WHERE slug='faq'; `payment_settings` (schema.prisma:496)
- **refresh_requirement:** Re-sync FAQ on edit; query `payment_settings` live for enablement.

---

## KB-PA-002 — COD availability

- **category:** Payments & Checkout
- **intent:** "Is Cash on Delivery available?"
- **content:** "Yes! COD is available for orders across India." (CMS FAQ page.) Live
  applicability (max order value, zone limits) comes from `payment_settings.cod_max_amount` —
  query live before promising COD for a specific cart.
- **source:** `cms_pages` slug `faq` + `payment_settings.cod_max_amount`
- **source_type:** db-static + db-dynamic
- **verification_status:** VERIFIED (general claim); per-order eligibility is live data
- **source_location:** `cms_pages` WHERE slug='faq'; `payment_settings` row
- **refresh_requirement:** Query `payment_settings` at answer time for limits.

---

## KB-PA-003 — Coupon code usage

- **category:** Payments & Checkout
- **intent:** "How do I use a coupon/discount code?"
- **content:** "Enter your code in the 'Apply Coupon' field on the checkout page before payment."
- **source:** `cms_pages` slug `faq`
- **source_type:** db-static
- **verification_status:** VERIFIED
- **source_location:** `cms_pages` WHERE slug='faq' (section "Ordering & Payment")
- **refresh_requirement:** Re-sync when admin edits the FAQ CMS page.

---

## KB-PA-004 — Order number format

- **category:** Orders & Lifecycle
- **intent:** "What does my order number look like?" (also useful for validating user input)
- **content:** Format `DMW-YYYYMMDD-NNNN` (e.g. DMW-20260809-0001), generated from the
  PostgreSQL sequence `order_number_seq`. The chatbot also sees the last-8-chars form (e.g.
  "20260809-0001" suffix of the UUID-based display ID used in WhatsApp templates) — both refer
  to the same order record.
- **source:** MERGEX_DUDEMW_CONTEXT.md §7 ("Order Number Format")
- **source_type:** context-doc
- **verification_status:** VERIFIED
- **source_location:** `MERGEX_DUDEMW_CONTEXT.md` §7; `src/lib/actions/orders.ts` createOrder()
- **refresh_requirement:** Changes only with code deploy.

---

## KB-PA-005 — Per-customer order data (EXCLUSION RULE)

- **category:** Governance
- **intent:** — (architecture rule, not customer content)
- **content:** Customer-specific order status, payment status, addresses, phone numbers and
  payment records MUST NOT be embedded in general chatbot knowledge. If the chatbot later
  supports "where is my order", it must be a separate authenticated/dynamic lookup
  (e.g. against `orders` by order number + verified contact detail), not KB content. This KB
  contains zero per-customer data by design.
- **source:** Task constraints + context doc §6 (business-critical data handling)
- **source_type:** context-doc
- **verification_status:** VERIFIED (rule)
- **source_location:** `MERGEX_DUDEMW_CONTEXT.md` §6
- **refresh_requirement:** Standing rule.
