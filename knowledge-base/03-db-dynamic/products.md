# KB — Product Catalogue (db-dynamic — SNAPSHOT ONLY)

> ⚠️ **This file is a point-in-time snapshot (2026-09-04) for audit and testing.**
> Prices, variants and stock change without deploys. The chatbot must answer product/price/stock
> questions from a **live** source: the `products` / `product_variants` / `product_images` tables
> (or the existing `/api/products` and `/api/search` endpoints).
>
> Raw machine extract: `_extracts/db-products-snapshot.json` (31 published products, 6 categories).

---

## KB-PR-001 — Catalogue overview

- **category:** Products
- **intent:** "What do you sell?" / "What products do you have?"
- **content (snapshot):** 31 published products across 6 active categories:
  1. Premium Topwear (`premium-topwear`)
  2. Bottomwear Essentials (`bottomwear-essentials`)
  3. The ₹600 Combo Store (`combo-600-store`)
  4. Cargo Pants (`cargo-pants`)
  5. track pants (`track-pants`)
  6. Premium Tees & Zippers (`premium-tees-zippers`)

  Typical items: cargo pants (₹300), track pants (₹250), full-sleeve zipper t-shirts (₹300),
  baggy track pants (₹250). No brand values set (house products).
- **source:** `products` (status='published') + `categories` (status='active')
- **source_type:** db-dynamic
- **verification_status:** VERIFIED (as of extract date)
- **source_location:** `products`, `categories` tables; extract in `_extracts/db-products-snapshot.json`
- **refresh_requirement:** LIVE — query DB at answer time. Snapshot older than ~1 week should be
  considered stale for stock answers.

---

## KB-PR-002 — Pricing (dynamic)

- **category:** Products
- **intent:** "How much is <product>?"
- **content:** ⚠️ LIVE DATA. Price authority: `product_variants.price` / `discount_price`
  (fallback `products.price` / `compare_price`). Snapshot shows price clusters: ₹250 (track
  pants), ₹300 (cargo pants, zipper tees). The "₹600 Combo Store" category implies combo
  pricing mechanics not documented in rules — do not explain combo pricing beyond the category
  name without client input (see KB-PEND-006).
- **source:** `products` + `product_variants`
- **source_type:** db-dynamic
- **verification_status:** VERIFIED (snapshot) — must be answered live
- **source_location:** `products.price`, `product_variants.price`/`discount_price`
- **refresh_requirement:** LIVE query.

---

## KB-PR-003 — Stock availability (dynamic)

- **category:** Products
- **intent:** "Is <product> in stock?" / "Do you have size M in black?"
- **content:** ⚠️ LIVE DATA. Authority: `product_variants.stock` per variant. Snapshot
  (2026-09-04): of 158 variants, 74 in stock / 84 at zero. Notably all NS Fabric Baggy Track
  Pant variants were out of stock at extract time. Never answer stock from a snapshot.
- **source:** `product_variants.stock`
- **source_type:** db-dynamic
- **verification_status:** VERIFIED (snapshot) — must be answered live
- **source_location:** `product_variants` (stock, active)
- **refresh_requirement:** LIVE query — stock can change between any two customer messages.

---

## KB-PR-004 — Variant/size structure

- **category:** Products
- **intent:** "What sizes/colors does <product> come in?"
- **content:** ⚠️ LIVE DATA. Variants carry `name` (e.g. "M / Black" convention parsed by
  `getOrderForResume`), `stock`, `price`, `image_url` (`product_images` provides gallery).
  Snapshot: most products have 3–4 variants (size/color combos). Answer size/color availability
  from live `product_variants` joined via `variant_option_values` when needed.
- **source:** `product_variants` + `variant_option_values` + `product_images`
- **source_type:** db-dynamic
- **verification_status:** VERIFIED (structure confirmed in schema and code)
- **source_location:** schema.prisma (product_variants:416 region); `src/lib/actions/orders.ts`
  getOrderForResume (name-parsing convention)
- **refresh_requirement:** LIVE query.

---

## KB-PR-005 — Product descriptions

- **category:** Products
- **intent:** "Tell me about <product>" / fabric, care, fit details
- **content:** ⚠️ LIVE DATA. `products.description` / `subtitle` / `meta_description` hold
  per-product copy. Many published products have thin or absent descriptions in the current
  snapshot — the chatbot must not fabricate fabric/care details that aren't in the DB.
- **source:** `products` (description, subtitle)
- **source_type:** db-dynamic
- **verification_status:** VERIFIED (as of extract date); coverage gaps exist
- **source_location:** `products.description`
- **refresh_requirement:** LIVE query; flag missing descriptions to client for content enrichment.
