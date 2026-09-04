# KB — Returns, Refunds & Exchanges (db-static)

> Source of truth: `faqs` table + `cms_pages` (slugs `refund-policy` and `returns`).
> Both policy pages carry identical content (verified 2026-09-04) — one canonical policy, two slugs.
> **Critical conflict** on the return window: see KB-RE-001 and KB-PEND-003.

---

## KB-RE-001 — Return window ⚠️ CONFLICT

- **category:** Returns & Refunds
- **intent:** "How long do I have to return an item?"
- **content:** **TWO PUBLISHED, CONTRADICTORY VALUES:**
  1. `faqs` table ("Returns & Refunds"): "You must make a refund/return request within **3 days**
     from the date of delivery. The item must be unused and in its original packaging with all
     accompanying documents."
  2. `cms_pages` slug `faq` ("Returns & Refunds" section): "**7-day** no questions asked returns.
     Contact us within 7 days of delivery." while the dedicated `refund-policy`/`returns` CMS
     pages say **3 days**.

  Both are live, published, admin-editable. The detailed policy pages (3 days) are treated as
  canon per the DB-conflict rule, but the customer-facing "7-day no-questions-asked" claim is a
  significant commitment that must be resolved by the client before the chatbot states either
  (KB-PEND-003).
- **source:** `faqs` + `cms_pages` (slug `faq`) + `cms_pages` (slugs `refund-policy`, `returns`)
- **source_type:** db-static
- **verification_status:** PENDING_CLIENT_CONFIRMATION
- **source_location:** `faqs` WHERE title='Returns & Refunds'; `cms_pages` slug='faq';
  `cms_pages` slugs 'refund-policy'/'returns' §1
- **refresh_requirement:** Re-sync on admin edit; re-verify once client resolves the window.

---

## KB-RE-002 — Return eligibility conditions

- **category:** Returns & Refunds
- **intent:** "Can I return this?" / "What items are eligible for return?"
- **content:** Returns/refunds offered when: the item is defective or damaged upon arrival; the
  wrong item was delivered; or the item does not match the description or images on the website.
  Eligibility requires: item unused, in original packaging, with all accompanying documents
  (invoice, shipping label, etc.).
- **source:** `cms_pages` slugs `refund-policy` + `returns` (identical content) — mirrored in `faqs`
- **source_type:** db-static
- **verification_status:** VERIFIED
- **source_location:** `cms_pages` §1 (both slugs); `faqs` "What conditions make an item eligible for return?"
- **refresh_requirement:** Re-sync on admin edit.

---

## KB-RE-003 — Non-refundable items

- **category:** Returns & Refunds
- **intent:** "Are sale items refundable?"
- **content:** No refunds for items purchased during sale, clearance, or promotional offers.
- **source:** `cms_pages` slugs `refund-policy` + `returns` §2 — mirrored in `faqs`
- **source_type:** db-static
- **verification_status:** VERIFIED
- **source_location:** `cms_pages` §2; `faqs` "Are all items refundable?"
- **refresh_requirement:** Re-sync on admin edit.

---

## KB-RE-004 — How to request a return/refund

- **category:** Returns & Refunds
- **intent:** "How do I return an item?" / "How do I get a refund?"
- **content:** Contact customer support via WhatsApp at **9488924935**. Provide: order number,
  images of the item (if damaged/defective), and a brief explanation. The CMS FAQ page also
  says: "Simply message us on WhatsApp or email. We'll arrange a pickup."
- **source:** `cms_pages` slugs `refund-policy`/`returns` §3 + `faqs` + `cms_pages` slug `faq`
- **source_type:** db-static
- **verification_status:** VERIFIED (WhatsApp number matches canonical KB-CO-002)
- **source_location:** `cms_pages` §3; `faqs` "How do I request a refund?"
- **refresh_requirement:** Re-sync on admin edit.

---

## KB-RE-005 — Refund timeline

- **category:** Returns & Refunds
- **intent:** "When will I get my refund?" / "How long does a replacement take?"
- **content:** After inspection and approval, refunds are credited to the original payment
  method within **3–4 business days**. Approved replacements are delivered within **5–7 days**.
  For late/missing refunds, first check with the bank/payment provider, then contact
  9488924935.
- **source:** `cms_pages` slugs `refund-policy`/`returns` §3–4 + `faqs`
- **source_type:** db-static
- **verification_status:** VERIFIED — but note the CMS FAQ page separately says "5–7 business
  days after we receive the returned item"; the detailed policy (3–4 days after approval) is
  more specific and treated as canon (minor variance, flagged within KB-PEND-003 scope).
- **source_location:** `cms_pages` §3–4; `faqs` "How long does it take to receive my refund?"
- **refresh_requirement:** Re-sync on admin edit.

---

## KB-RE-006 — Product authenticity

- **category:** Product Info
- **intent:** "Are your products original?"
- **content:** "Yes! All products are designed and sourced by us. No fakes, no replicas."
- **source:** `cms_pages` slug `faq` (section "Product & Sizing")
- **source_type:** db-static
- **verification_status:** VERIFIED
- **source_location:** `cms_pages` WHERE slug='faq'
- **refresh_requirement:** Re-sync when admin edits the FAQ CMS page.

---

## KB-RE-007 — Exchanges

- **category:** Returns & Refunds
- **intent:** "Can I exchange an item?"
- **content:** No dedicated exchange policy exists in any source. The refund policy mentions
  replacements ("damaged / defective / replacement products... delivered within 5-7 days") for
  approved damage/defect cases only. A general size-exchange program is **not documented** —
  do not invent one.
- **source:** Absence verified across `faqs`, `cms_pages` (all 5 slugs), repo policy pages
- **source_type:** db-static (documented absence)
- **verification_status:** PENDING_CLIENT_CONFIRMATION (does an exchange policy exist offline?)
- **source_location:** `cms_pages` slugs 'refund-policy'/'returns' §3 (replacement mention)
- **refresh_requirement:** Re-verify if client adds an exchange policy.
