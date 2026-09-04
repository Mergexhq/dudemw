# KB — Company, Contact & Store Info (STATIC + semi-static)

> Layer: `01-static`. Contact details marked PENDING_CLIENT_CONFIRMATION where sources conflict.

---

## KB-CO-001 — Company identity

- **category:** Company Info
- **intent:** "Who are you?" / "Tell me about the store"
- **content:** "Established in 2020, DUDE MENS WEAR is a trusted retail clothing brand located in
  Tharamangalam, Salem District. We are committed to providing high-quality men's clothing at the
  best prices." Store known for reliability, affordability, customer satisfaction; offers online
  ordering through the website. Tagline: "At DUDE MENS WEAR, quality meets affordability."

  Store settings description: "Premium menswear from Salems heart. Quality fabric, honest prices,
  happy customers. Shop cargo pants, t-shirts & track pants with free shipping on orders above
  ₹499."
- **source:** `cms_pages` slug `about-us` + `store_settings`
- **source_type:** db-static
- **verification_status:** VERIFIED
- **source_location:** `cms_pages` WHERE slug='about-us'; `store_settings` row 1 (description)
- **refresh_requirement:** Re-sync when admin edits About page or store settings.

---

## KB-CO-002 — Canonical support contacts (RESOLVED — DB wins)

- **category:** Contact & Support
- **intent:** "How do I contact support?" / "What's your WhatsApp number?"
- **content:**
  - **Support email:** support@dudemw.com (from `store_settings.support_email` — matches context doc)
  - **Support phone / WhatsApp:** +91 94889 24935 (from `store_settings.support_phone` — matches
    context doc WhatsApp and the refund policy's contact number)
- **source:** `store_settings` (DB) + MERGEX_DUDEMW_CONTEXT.md §1
- **source_type:** db-static + context-doc
- **verification_status:** VERIFIED (DB and context doc agree)
- **source_location:** `store_settings` row 1; `MERGEX_DUDEMW_CONTEXT.md` §1
- **refresh_requirement:** Re-sync when admin updates store settings.

  ⚠️ The contact page (`src/app/(store)/contact/page.tsx`) shows DIFFERENT values:
  `hello@dudemenswear.com` and +91 98765 43210. DB values take precedence per the conflict rule.
  See KB-PEND-001.

---

## KB-CO-003 — Business hours

- **category:** Contact & Support
- **intent:** "When are you open / available?"
- **content:** Contact page states: "Monday - Saturday: 10:00 AM - 7:00 PM" and
  "Sunday: 11:00 AM - 6:00 PM". Phone support line: "Mon-Sat, 10 AM - 7 PM IST".
- **source:** Contact page hardcode
- **source_type:** static-code
- **verification_status:** PENDING_CLIENT_CONFIRMATION (UI-only, never confirmed with client;
  also the contact page itself carries placeholder phone/email, lowering trust in this block)
- **source_location:** `src/app/(store)/contact/page.tsx:210–232` (Business Hours card + phone card)
- **refresh_requirement:** Re-extract on code change; recommend client moves this into DB.

---

## KB-CO-004 — Physical location & stores

- **category:** Company Info
- **intent:** "Where is your store?" / "Do you have a physical store?"
- **content:** DB `store_locations` (active):
  1. **Dude Mens Wear - Main Store** — Salem, Tamil Nadu (location_type: warehouse, is_primary)
  2. **Dude Mens Wear Store** — SALEM, Tamil Nadu (location_type: store, is_primary)

  About page (CMS): located in **Tharamangalam, Salem District**, Tamil Nadu.
  Full street addresses live in the DB (address_line1/2, pincode) — see
  `02-db-static/store-locations.md` for the record snapshot. Chatbot should answer from the live
  table or this verified snapshot; both primary rows are active.
- **source:** `store_locations` (DB) + `cms_pages` slug `about-us`
- **source_type:** db-static
- **verification_status:** VERIFIED (city consistent: Salem). Note the warehouse/store dual
  primary flags and Salem vs SALEM casing are cosmetic inconsistencies only.
- **source_location:** `store_locations` WHERE is_active; `cms_pages` slug='about-us'
- **refresh_requirement:** Re-sync when admin adds/edits locations.

---

## KB-CO-005 — Store credentials

- **category:** Company Info
- **intent:** (Admin/invoice-facing) "What is your GST number?" / legal identity
- **content:** store_name "Dude Mens Wear"; legal_name "Dude Mens Wear"; GST 33BGHPV4999P;
  currency INR; timezone Asia/Kolkata. (Note: GST string is 12 chars — a standard GSTIN is 15;
  recorded verbatim from DB, not corrected.)
- **source:** `store_settings` row 1
- **source_type:** db-static
- **verification_status:** PENDING_CLIENT_CONFIRMATION (possible truncated GSTIN — verify with
  client before using in any customer-facing answer)
- **source_location:** `store_settings` (gst_number, legal_name)
- **refresh_requirement:** Re-sync when admin updates store settings.
