# KB — Pending Client Confirmations (BLOCKED from customer-facing use)

> Every entry below has conflicting or unconfirmed information. **None of these may be stated
> to customers** until the client resolves them. Resolution rule used throughout the KB:
> DB (`store_settings` / `cms_pages` / `faqs`) wins over hardcoded UI; context doc wins over
> nothing; ties become pending items here.

---

## KB-PEND-001 — Support email & phone on contact page

- **conflict:** Contact page (`src/app/(store)/contact/page.tsx:192,210`) shows
  `hello@dudemenswear.com` and `+91 98765 43210` (an obvious placeholder). `store_settings`
  holds `support@dudemw.com` / `9488924935`, matching the engagement context doc and refund
  policy.
- **current KB stance:** DB values canonical (KB-CO-002).
- **question for client:** "Is hello@dudemenswear.com a real monitored inbox, or should the
  contact page be corrected to support@dudemw.com / +91 94889 24935?"
- **blocks:** KB-CO-003 trust, any chatbot answer that quotes contact details.

## KB-PEND-002 — WhatsApp chat link on CMS FAQ page

- **conflict:** `cms_pages` slug `faq` ends with "WhatsApp: Chat Now → https://wa.me/919876543210"
  — a placeholder number, while the canonical WhatsApp is 9198765432**4935**... i.e. wa.me/919488924935.
- **current KB stance:** canonical number from `store_settings`.
- **question for client:** "May we correct the wa.me link in the FAQ CMS page to 919488924935?"
- **blocks:** KB-SZ-005, any "chat with us on WhatsApp" CTA.

## KB-PEND-003 — Return window: 3 days vs 7 days

- **conflict:** Policy pages + FAQ table say **3 days**; the CMS FAQ page advertises
  "**7-day no questions asked** returns". Refund-timeline variance (3–4 vs 5–7 business days)
  is also in scope here.
- **current KB stance:** detailed policy (3 days) treated as canon; chatbot must NOT state a
  window until resolved.
- **question for client:** "What is the true return window — 3 days or 7 days? And is the
  refund credit 3–4 or 5–7 business days?"
- **blocks:** KB-RE-001, KB-RE-005 — highest-priority pending item (legal/policy claim).

## KB-PEND-004 — Free shipping above ₹499

- **conflict:** `store_settings.description` and the CMS FAQ page both claim "free shipping on
  orders above ₹499", but `shipping_rules` has only flat per-tier rates (₹60/₹100/₹150) with no
  threshold logic, and no code path was found applying a ₹499 waiver.
- **current KB stance:** claim recorded; not asserted to customers.
- **question for client:** "Does free shipping above ₹499 actually apply at checkout today?"
- **blocks:** KB-SH-004, KB-CO-001 (description text).

## KB-PEND-005 — Zone → state mapping for shipping rates

- **gap:** `shipping_rules` uses zones (tamil_nadu, south_india, north_india, east_india,
  west_india, all_india) but `shipping_zones` is empty — there is no data mapping Indian states
  to zones, so the chatbot cannot route "shipping to Mumbai?" to a rate.
- **question for client / dev task:** "Provide the state→zone list, or confirm the chatbot
  should call `/api/shipping` with a pincode and quote the computed rate."
- **blocks:** KB-SH-004 customer-facing use.

## KB-PEND-006 — Campaign discount values

- **conflict:** Active campaign names promise "₹100 OFF / 150rs OFF" but all
  `campaign_actions.discount_value` rows are 50. Combo ("₹600 Combo Store") mechanics are also
  undocumented.
- **current KB stance:** no numbers quoted to customers.
- **question for client:** "What discount do the three active campaigns actually apply, and how
  does the ₹600 combo work?"
- **blocks:** KB-PR-002, campaigns entry.

## KB-PEND-007 — GST number length

- **gap:** `store_settings.gst_number` = "33BGHPV4999P" (12 chars; standard GSTIN is 15).
- **question for client:** "Please confirm the full GSTIN."
- **blocks:** KB-CO-005.

## KB-PEND-008 — Business hours

- **gap:** Hours exist only hardcoded on the contact page (Mon–Sat 10–7, Sun 11–6), a page that
  also carries placeholder contact info.
- **question for client:** "Are these the real support/store hours?"
- **blocks:** KB-CO-003.
