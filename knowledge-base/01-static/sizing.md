# KB — Sizing & Fit (STATIC)

> Layer: `01-static` · Source type: `static-code` · Changes only via code deploy.

---

## KB-SZ-001 — T-Shirt size chart

- **category:** Sizing & Fit
- **intent:** "What size t-shirt should I order?" / "What are the t-shirt measurements?"
- **content:**

| Size | Chest (in) | Length (in) | Shoulder (in) |
|------|-----------|-------------|----------------|
| S | 36–38 | 27 | 16 |
| M | 38–40 | 28 | 17 |
| L | 40–42 | 29 | 18 |
| XL | 42–44 | 30 | 19 |
| XXL | 44–46 | 31 | 20 |

- **source:** Size Guide page (`sizeData.tshirts`)
- **source_type:** static-code
- **verification_status:** VERIFIED
- **source_location:** `src/app/(store)/size-guide/page.tsx` (sizeData.tshirts, ~lines 11–17)
- **refresh_requirement:** Re-extract only if the size-guide page is edited (code deploy).

---

## KB-SZ-002 — Pants size chart

- **category:** Sizing & Fit
- **intent:** "What size pants should I order?" / "Waist/hip measurements?"
- **content:**

| Size | Waist (in) | Hip (in) | Length (in) |
|------|-----------|----------|-------------|
| 28 | 28 | 36 | 39 |
| 30 | 30 | 38 | 40 |
| 32 | 32 | 40 | 41 |
| 34 | 34 | 42 | 42 |
| 36 | 36 | 44 | 43 |

- **source:** Size Guide page (`sizeData.pants`)
- **source_type:** static-code
- **verification_status:** VERIFIED
- **source_location:** `src/app/(store)/size-guide/page.tsx` (sizeData.pants, ~lines 18–24)
- **refresh_requirement:** Re-extract only if the size-guide page is edited (code deploy).

---

## KB-SZ-003 — Shirt size chart

- **category:** Sizing & Fit
- **intent:** "What size shirt should I order?" / "Sleeve length?"
- **content:**

| Size | Chest (in) | Length (in) | Shoulder (in) | Sleeve (in) |
|------|-----------|-------------|----------------|-------------|
| S | 38–40 | 28 | 17 | 24 |
| M | 40–42 | 29 | 18 | 25 |
| L | 42–44 | 30 | 19 | 26 |
| XL | 44–46 | 31 | 20 | 27 |
| XXL | 46–48 | 32 | 21 | 28 |

- **source:** Size Guide page (`sizeData.shirts`)
- **source_type:** static-code
- **verification_status:** VERIFIED
- **source_location:** `src/app/(store)/size-guide/page.tsx` (sizeData.shirts, ~lines 25–31)
- **refresh_requirement:** Re-extract only if the size-guide page is edited (code deploy).

---

## KB-SZ-004 — Slim-fit guidance

- **category:** Sizing & Fit
- **intent:** "Will the Slim Fit shirts fit me?" / "Should I size up?"
- **content:** "Our Slim Fit cuts are designed to be closer to the body through the chest and
  waist. If you prefer a more relaxed feel or are between sizes, we recommend sizing up."
  (Full admin-entered answer; stored in DB FAQ table.)
- **source:** FAQ `faqs` table — "Sizing & Fit" category, question "How do I know if the 'Slim
  Fit' shirts will fit me?"
- **source_type:** db-static
- **verification_status:** VERIFIED
- **source_location:** `faqs` WHERE title='Sizing & Fit' (Neon DB, published)
- **refresh_requirement:** Re-sync when admin edits FAQs.

---

## KB-SZ-005 — Size help via WhatsApp

- **category:** Sizing & Fit
- **intent:** "I'm confused about my size, can someone help?"
- **content:** "Check our Size Guide on each product page. Still confused? Send us a WhatsApp
  message with your measurements!" (CMS FAQ page content.)
- **source:** `cms_pages` slug `faq`
- **source_type:** db-static
- **verification_status:** VERIFIED (content), but the WhatsApp number inside the source page
  (919876543210) is a PLACEHOLDER — see KB-PEND-002.
- **source_location:** `cms_pages` WHERE slug='faq', section "Product & Sizing"
- **refresh_requirement:** Re-sync when admin edits the FAQ CMS page.
